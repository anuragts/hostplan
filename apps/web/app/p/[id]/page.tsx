import {
	canRead,
	displayPath,
	isId,
	normalizeCode,
	type PlanMeta,
	planUrl,
	resolvePort,
	type StoredPlan,
} from "@hostplan/core";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { CodeGate } from "@/components/code-gate";
import { CopyId } from "@/components/copy-id";
import { CustomHtmlBadge } from "@/components/custom-html-badge";
import { HtmlPlanFrame } from "@/components/html-plan-frame";
import { MermaidRenderer } from "@/components/mermaid-renderer";
import { OpenIn } from "@/components/open-in";
import { PlanDocument, PlanEnvironment } from "@/components/plan-document";
import { Shell } from "@/components/shell";
import { ProseSkeleton } from "@/components/skeletons";
import { StatusBadge } from "@/components/status-badge";
import { StatusControl } from "@/components/status-control";
import { VisibilityBadge } from "@/components/visibility-badge";
import { getPlanReaderData, PlanReaderRail, PlanReaderSummary } from "@/features/plan-reader";
import { currentViewer } from "@/lib/current-viewer";
import { absoluteTime, relativeTime } from "@/lib/format";
import { ownsPlan } from "@/lib/plan-access";
import { buildOpenTargets } from "@/lib/providers";
import { clientKey, codeAttemptKey, consumeAttempt } from "@/lib/rate-limit";
import { renderPlanBody } from "@/lib/render";
import { isRemoteStore, planStore } from "@/lib/store";
import { isTrustedHtml } from "@/lib/trusted-html";

export const dynamic = "force-dynamic";

/**
 * Memoised for the request: `generateMetadata` and the page both need the plan,
 * and on a bucket-backed store each call is a row query plus a body download.
 * Next dedupes `fetch`, not this.
 */
const load = cache(async function load(id: string): Promise<StoredPlan | undefined> {
	return isId(id) ? planStore().get(id) : undefined;
});

/** The dependency badge needs a status, not a body — don't pay for one. */
async function loadMeta(id: string): Promise<PlanMeta | undefined> {
	if (!isId(id)) return undefined;
	const store = planStore();
	return store.getMeta === undefined ? (await load(id))?.meta : store.getMeta(id);
}

export async function generateMetadata({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ code?: string }>;
}): Promise<Metadata> {
	// Independent lookups, and on a remote store each is a round trip.
	const [plan, viewer] = await Promise.all([load((await params).id), currentViewer()]);
	// Plans are shared by link, not found by search — a public one landing in
	// an index would defeat the point of choosing who gets the URL.
	const robots = { index: false, follow: false };
	// A locked plan gives nothing away in the tab title or link previews.
	if (plan === undefined) return { title: "Plan not found", robots };
	// Whoever is about to read the plan is already reading its title, so the tab
	// may as well say which one it is. Same check the page itself runs.
	const isOwner = ownsPlan(plan, viewer);
	const code = normalizeCode((await searchParams).code);
	if (!canRead(plan.meta, { isOwner, code })) return { title: "Private plan", robots };
	return { title: plan.meta.title, robots };
}

/**
 * `updated` moves whenever the body does, so it is both the cache key and the
 * invalidation — a revision renders once and is then served from memory.
 */
async function PlanBody({ id, updated, body }: { id: string; updated: string; body: string }) {
	if (body.trim().length === 0) {
		return (
			<div className="plan-empty-state" role="status">
				<p className="plan-empty-title">No details yet</p>
				<p className="plan-empty-copy">This plan exists, but its author has not added a body.</p>
			</div>
		);
	}
	const html = await renderPlanBody(`${id}:${updated}`, body);
	const containerId = `plan-body-${id}`;
	return (
		<>
			<article
				id={containerId}
				className="plan-prose prose max-w-none prose-pre:bg-transparent prose-pre:p-0"
				// The pipeline runs server-side and drops raw HTML, so nothing from a plan
				// reaches the DOM as markup. HTML plans use the sandboxed iframe above.
				// biome-ignore lint/security/noDangerouslySetInnerHtml: markdown is sanitized by construction
				dangerouslySetInnerHTML={{ __html: html }}
			/>
			<MermaidRenderer containerId={containerId} />
		</>
	);
}

export default async function PlanPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ code?: string }>;
}) {
	const { id } = await params;
	const [plan, viewer, headerList] = await Promise.all([load(id), currentViewer(), headers()]);
	// Renders p/[id]/not-found.tsx with a real 404 status, rather than a 200 that
	// only looks like an error.
	if (plan === undefined) notFound();

	const { meta } = plan;
	const trustedHtml = meta.format === "html" && isTrustedHtml(plan.body);
	const supplied = (await searchParams).code;
	const code = normalizeCode(supplied);
	const isOwner = ownsPlan(plan, viewer);

	if (!canRead(meta, { isOwner, code })) {
		// Only a real attempt burns rate-limit budget; arriving with no code at
		// all is just someone opening the bare link.
		let throttled = false;
		let retryAfter = 0;
		if (supplied !== undefined && supplied.length > 0) {
			const limit = consumeAttempt(codeAttemptKey(clientKey({ headers: headerList })));
			throttled = !limit.allowed;
			retryAfter = limit.retryAfterSeconds;
		}
		// `plan.body` is never referenced on this path, so the content is absent
		// from the response rather than hidden in it.
		return (
			<PlanEnvironment id={meta.id}>
				<Shell crumbs={[{ label: "private" }]}>
					<CodeGate
						id={id}
						wrong={supplied !== undefined && supplied.length > 0}
						throttled={throttled}
						retryAfterSeconds={retryAfter}
					/>
				</Shell>
			</PlanEnvironment>
		);
	}

	// The step before this one in a stack, if any — worth a lookup because
	// "blocked" or "ready" is the first thing a reader wants to know.
	const dependency = meta.dependsOn === undefined ? undefined : await loadMeta(meta.dependsOn);
	const blocked = dependency !== undefined && dependency.status !== "done";

	// Absolute, because it goes into deep-link prompts that leave the browser.
	const host = headerList.get("host");
	const proto = headerList.get("x-forwarded-proto") ?? "http";
	const url =
		host === null ? planUrl(await resolvePort(), meta.id) : `${proto}://${host}/p/${meta.id}`;

	// Index pages are owner-only, so for a code holder the crumbs are labels
	// rather than links into a sign-in wall.
	const projectHref = `/${encodeURIComponent(plan.projectDir)}`;
	const crumbs = isOwner
		? [
				{ label: meta.project, href: projectHref },
				{
					label: meta.branch,
					href: `${projectHref}/${encodeURIComponent(plan.branchDir)}`,
				},
			]
		: [{ label: meta.project }, { label: meta.branch }];
	const readerData = meta.format === "md" ? getPlanReaderData(plan.body, meta.title) : undefined;
	const openTargets = buildOpenTargets({
		planUrl: url,
		// Local paths are the owner's alone. Everyone else opens the shared URL.
		...(isOwner && !isRemoteStore()
			? {
					planPath: plan.path,
					...(meta.cwd === undefined ? {} : { cwd: meta.cwd }),
					...(meta.source === undefined ? {} : { source: meta.source }),
				}
			: {}),
	});

	return (
		<PlanEnvironment id={meta.id}>
			<Shell
				crumbs={crumbs}
				action={
					meta.format === "html" ? (
						<div className="plan-reader-toolbar print:hidden">
							<CustomHtmlBadge />
						</div>
					) : undefined
				}
			>
				{/* Mobile and HTML plans keep a floating action, so reserve its last line. */}
				<main className="plan-page-content pb-24" data-plan-format={meta.format}>
					<PlanDocument>
						<div className="plan-reader-main">
							<header className="plan-document-header">
								<h1 className="plan-title">{meta.title}</h1>
								<aside className="plan-meta" aria-label="Plan details">
									<CopyId id={meta.id} />
									{/* The owner can move the plan through its lifecycle from here;
								    everyone else sees where it got to. */}
									{isOwner ? (
										<StatusControl id={meta.id} status={meta.status} />
									) : (
										<StatusBadge status={meta.status} />
									)}
									<VisibilityBadge meta={meta} isOwner={isOwner} />
									{meta.dependsOn !== undefined && (
										<span
											data-blocked={blocked}
											className={`plan-dependency rounded border px-2 py-0.5 font-mono text-xs ${blocked ? "border-amber-500/40 text-amber-400" : "border-line text-ink-faint"}`}
										>
											{blocked ? "blocked · waits on " : "follows "}
											<a href={`/p/${meta.dependsOn}`} className="underline underline-offset-2">
												{meta.dependsOn}
											</a>
										</span>
									)}
									<span className="plan-meta-updated" title={absoluteTime(meta.updated)}>
										updated {relativeTime(meta.updated)}
									</span>
									{/* Where the plan sits on disk is the owner's business only. */}
									{isOwner && !isRemoteStore() && (
										<>
											<span className="plan-meta-divider">|</span>
											<span className="plan-meta-path font-mono">{displayPath(plan.path)}</span>
										</>
									)}
								</aside>
								{readerData !== undefined && <PlanReaderSummary data={readerData} />}
							</header>

							<div className="plan-document-body">
								{readerData === undefined ? (
									<HtmlPlanFrame
										src={`/api/render/${meta.id}${code === undefined ? "" : `?code=${code}`}`}
										title={meta.title}
										trusted={trustedHtml}
									/>
								) : (
									// The reader chrome is immediate; code highlighting can stream in later.
									<Suspense fallback={<ProseSkeleton />}>
										<PlanBody id={meta.id} updated={meta.updated} body={readerData.body} />
									</Suspense>
								)}
							</div>
						</div>
						{readerData !== undefined && (
							<PlanReaderRail data={readerData} targets={openTargets} planId={meta.id} />
						)}
					</PlanDocument>
				</main>

				{readerData === undefined && <OpenIn targets={openTargets} />}
			</Shell>
		</PlanEnvironment>
	);
}
