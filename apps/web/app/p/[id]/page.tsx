import { displayPath, getPlan, isId, planUrl, resolvePort } from "@hostplan/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CopyId } from "@/components/copy-id";
import { OpenIn } from "@/components/open-in";
import { Shell } from "@/components/shell";
import { absoluteTime, relativeTime } from "@/lib/format";
import { buildOpenTargets } from "@/lib/providers";
import { renderMarkdown, stripLeadingTitle } from "@/lib/render";

export const dynamic = "force-dynamic";

async function load(id: string) {
	return isId(id) ? getPlan(id) : undefined;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const plan = await load((await params).id);
	return {
		title: plan === undefined ? "Plan not found · hostplan" : `${plan.meta.title} · hostplan`,
	};
}

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const plan = await load(id);
	// Renders p/[id]/not-found.tsx with a real 404 status, rather than a 200 that
	// only looks like an error.
	if (plan === undefined) notFound();

	const { meta } = plan;
	const url = planUrl(await resolvePort(), meta.id);

	return (
		<Shell
			crumbs={[
				{ label: meta.project, href: `/${encodeURIComponent(plan.projectDir)}` },
				{
					label: meta.branch,
					href: `/${encodeURIComponent(plan.projectDir)}/${encodeURIComponent(plan.branchDir)}`,
				},
			]}
		>
			<header className="mb-8 border-b border-line pb-6">
				<h1 className="text-2xl font-semibold tracking-tight text-ink">{meta.title}</h1>
				<div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink-faint">
					<CopyId id={meta.id} />
					<span title={absoluteTime(meta.updated)}>updated {relativeTime(meta.updated)}</span>
					<span className="text-line">|</span>
					<span className="font-mono">{displayPath(plan.path)}</span>
				</div>
			</header>

			{/* Room at the bottom so the floating button never covers the last lines. */}
			<div className="pb-24">
				{meta.format === "html" ? (
					// Plans are untrusted enough that they shouldn't share an origin with the app.
					<iframe
						src={`/api/raw/${meta.id}`}
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
					planPath: plan.path,
					planUrl: url,
					...(meta.cwd === undefined ? {} : { cwd: meta.cwd }),
					...(meta.source === undefined ? {} : { source: meta.source }),
				})}
			/>
		</Shell>
	);
}
