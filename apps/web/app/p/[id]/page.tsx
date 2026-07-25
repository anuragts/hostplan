import { canRead, displayPath, isId, normalizeCode, planUrl, resolvePort } from "@hostplan/core";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CodeGate } from "@/components/code-gate";
import { CopyId } from "@/components/copy-id";
import { OpenIn } from "@/components/open-in";
import { Shell } from "@/components/shell";
import { VisibilityBadge } from "@/components/visibility-badge";
import { isOwnerSession } from "@/lib/auth";
import { absoluteTime, relativeTime } from "@/lib/format";
import { buildOpenTargets } from "@/lib/providers";
import { clientKey, codeAttemptKey, consumeAttempt } from "@/lib/rate-limit";
import { renderMarkdown, stripLeadingTitle } from "@/lib/render";
import { isRemoteStore, planStore } from "@/lib/store";

export const dynamic = "force-dynamic";

async function load(id: string) {
	return isId(id) ? planStore().get(id) : undefined;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const plan = await load((await params).id);
	// A locked plan gives nothing away in the tab title or link previews.
	if (plan === undefined) return { title: "Plan not found · hostplan" };
	if (plan.meta.visibility !== "public") return { title: "Private plan · hostplan" };
	return { title: `${plan.meta.title} · hostplan` };
}

export default async function PlanPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ code?: string }>;
}) {
	const { id } = await params;
	const plan = await load(id);
	// Renders p/[id]/not-found.tsx with a real 404 status, rather than a 200 that
	// only looks like an error.
	if (plan === undefined) notFound();

	const { meta } = plan;
	const supplied = (await searchParams).code;
	const code = normalizeCode(supplied);
	const isOwner = await isOwnerSession();
	const headerList = await headers();

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
					<VisibilityBadge meta={meta} isOwner={isOwner} />
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
					<article
						className="prose prose-invert max-w-none prose-headings:tracking-tight prose-a:text-accent prose-pre:bg-transparent prose-pre:p-0"
						// The pipeline runs server-side and drops raw HTML, so nothing from a plan
						// reaches the DOM as markup. HTML plans use the sandboxed iframe above.
						// biome-ignore lint/security/noDangerouslySetInnerHtml: markdown is sanitized by construction
						dangerouslySetInnerHTML={{
							__html: await renderMarkdown(stripLeadingTitle(plan.body, meta.title)),
						}}
					/>
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
