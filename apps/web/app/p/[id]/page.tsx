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
import { Shell } from "@/components/shell";
import { ProseSkeleton } from "@/components/skeletons";
import { StatusBadge } from "@/components/status-badge";
import { StatusControl } from "@/components/status-control";
import { VisibilityBadge } from "@/components/visibility-badge";
import { currentViewer } from "@/lib/current-viewer";
import { absoluteTime, relativeTime } from "@/lib/format";
import { buildOpenTargets } from "@/lib/providers";
import { clientKey, codeAttemptKey, consumeAttempt } from "@/lib/rate-limit";
import { renderPlanBody, stripLeadingTitle } from "@/lib/render";
import { isRemoteStore, planStore } from "@/lib/store";
import type { Viewer } from "@/lib/viewer";

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

/**
 * Ownership is a property of the plan, not of being signed in. Treating any
 * authenticated visitor as the owner would hand them every private plan in
 * the store without a code.
 */
function ownedBy(plan: StoredPlan, viewer: Viewer): boolean {
	if (viewer.kind === "local") return true;
	return viewer.kind === "user" && plan.ownerId !== undefined && plan.ownerId === viewer.userId;
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
	if (plan === undefined) return { title: "Plan not found · hostplan", robots };
	// Whoever is about to read the plan is already reading its title, so the tab
	// may as well say which one it is. Same check the page itself runs.
	const isOwner = ownedBy(plan, viewer);
	const code = normalizeCode((await searchParams).code);
	if (!canRead(plan.meta, { isOwner, code })) return { title: "Private plan · hostplan", robots };
	return { title: `${plan.meta.title} · hostplan`, robots };
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
			className="prose prose-invert max-w-none prose-headings:tracking-tight prose-a:text-brand prose-pre:bg-transparent prose-pre:p-0"
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
	const isOwner = ownedBy(plan, viewer);

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
			<Shell crumbs={[{ label: "private" }]}>
				<CodeGate
					id={id}
					wrong={supplied !== undefined && supplied.length > 0}
					throttled={throttled}
					retryAfterSeconds={retryAfter}
				/>
			</Shell>
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
		<Shell crumbs={crumbs}>
			<header className="mb-8 border-b border-line pb-6">
				<h1 className="text-2xl font-semibold tracking-tight text-ink">{meta.title}</h1>
				<div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink-faint">
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
							className={`rounded border px-2 py-0.5 font-mono text-xs ${blocked ? "border-amber-500/40 text-amber-400" : "border-line text-ink-faint"}`}
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
							<span className="text-line">|</span>
							<span className="font-mono">{displayPath(plan.path)}</span>
						</>
					)}
				</div>
			</header>

			{/* Room at the bottom so the floating button never covers the last lines. */}
			<div className="pb-24">
				{meta.format === "html" ? (
					// Plans are untrusted enough that they shouldn't share an origin with the app.
					<iframe
						// The raw route runs the same canRead check, so the code has to
						// travel with the request.
						src={`/api/raw/${meta.id}${code === undefined ? "" : `?code=${code}`}`}
						title={meta.title}
						sandbox=""
						className="h-[75vh] w-full rounded-lg border border-line bg-white"
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
	);
}
