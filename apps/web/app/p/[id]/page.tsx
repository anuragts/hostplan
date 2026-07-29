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
import { OpenIn } from "@/components/open-in";
import { PlanDocument, PlanEnvironment, PlanThemeBootstrap } from "@/components/plan-document";
import { PlanThemeControl } from "@/components/plan-theme-control";
import { Shell } from "@/components/shell";
import { ProseSkeleton } from "@/components/skeletons";
import { StatusBadge } from "@/components/status-badge";
import { StatusControl } from "@/components/status-control";
import { VisibilityBadge } from "@/components/visibility-badge";
import { currentViewer } from "@/lib/current-viewer";
import { absoluteTime, relativeTime } from "@/lib/format";
import { ownsPlan } from "@/lib/plan-access";
import { buildOpenTargets } from "@/lib/providers";
import { clientKey, codeAttemptKey, consumeAttempt } from "@/lib/rate-limit";
import { renderPlanBody, stripLeadingTitle } from "@/lib/render";
import { isRemoteStore, planStore } from "@/lib/store";

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
async function PlanBody({ plan }: { plan: StoredPlan }) {
	const { meta } = plan;
	const html = await renderPlanBody(
		`${meta.id}:${meta.updated}`,
		stripLeadingTitle(plan.body, meta.title),
	);
	return (
		<article
			className="plan-prose prose max-w-none prose-pre:bg-transparent prose-pre:p-0"
			// The pipeline runs server-side and drops raw HTML, so nothing from a plan
			// reaches the DOM as markup. HTML plans use the sandboxed iframe above.
			// biome-ignore lint/security/noDangerouslySetInnerHtml: markdown is sanitized by construction
			dangerouslySetInnerHTML={{ __html: html }}
		/>
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
			<PlanEnvironment id={meta.id} theme={meta.theme}>
				<PlanThemeBootstrap id={meta.id} />
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

	return (
		<PlanEnvironment id={meta.id} theme={meta.theme}>
			{!isOwner && <PlanThemeBootstrap id={meta.id} />}
			<Shell crumbs={crumbs}>
				<div className="mb-4 flex justify-end print:hidden">
					<PlanThemeControl id={meta.id} authorTheme={meta.theme} isOwner={isOwner} />
				</div>

				{/* Room at the bottom so the floating button never covers the last lines. */}
				<div className="plan-page-content pb-24">
					<PlanDocument>
						<header className="plan-document-header">
							<h1 className="plan-title">{meta.title}</h1>
							<div className="plan-meta">
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
								<span title={absoluteTime(meta.updated)}>updated {relativeTime(meta.updated)}</span>
								{/* Where the plan sits on disk is the owner's business only. */}
								{isOwner && !isRemoteStore() && (
									<>
										<span className="plan-meta-divider">|</span>
										<span className="font-mono">{displayPath(plan.path)}</span>
									</>
								)}
							</div>
						</header>

						<div className="plan-document-body">
							{meta.format === "html" ? (
								// Plans are untrusted enough that they shouldn't share an origin with the app.
								<iframe
									// The raw route runs the same canRead check, so the code has to
									// travel with the request.
									src={`/api/raw/${meta.id}${code === undefined ? "" : `?code=${code}`}`}
									title={meta.title}
									sandbox=""
									className="plan-html-frame h-[75vh] w-full bg-white"
								/>
							) : (
								// Streamed: the header above is already useful, and holding it back
								// until the markdown is highlighted is what makes a cold open feel
								// like a blank page.
								<Suspense fallback={<ProseSkeleton />}>
									<PlanBody plan={plan} />
								</Suspense>
							)}
						</div>
					</PlanDocument>
				</div>

				<OpenIn
					targets={buildOpenTargets({
						planUrl: url,
						// Local paths are the owner's alone — for anyone else the prompts
						// point at this page instead.
						...(isOwner && !isRemoteStore()
							? {
									planPath: plan.path,
									...(meta.cwd === undefined ? {} : { cwd: meta.cwd }),
									...(meta.source === undefined ? {} : { source: meta.source }),
								}
							: {}),
					})}
				/>
			</Shell>
		</PlanEnvironment>
	);
}
