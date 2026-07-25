import { displayPath, storeRoot, summarizeProjects } from "@hostplan/core";
import { Empty, PageTitle, Row, Shell } from "@/components/shell";
import { plural, relativeTime } from "@/lib/format";
import { requireOwner } from "@/lib/require-owner";
import { isRemoteStore, planStore } from "@/lib/store";

// The store changes underneath us constantly; a cached page is a wrong page.
export const dynamic = "force-dynamic";

export default async function HomePage() {
	await requireOwner();
	const plans = await planStore().list();
	const projects = summarizeProjects(plans);

	return (
		<Shell crumbs={[]}>
			<PageTitle
				title="Projects"
				subtitle={`${plural(plans.length, "plan")}${isRemoteStore() ? "" : ` in ${displayPath(storeRoot())}`}`}
			/>
			{projects.length === 0 ? (
				<Empty message="No plans stored yet." hint="hsp add PLAN.md" />
			) : (
				<div className="flex flex-col gap-2">
					{projects.map((project) => (
						<Row
							key={project.dir}
							href={`/${encodeURIComponent(project.dir)}`}
							title={project.name}
							meta={`${plural(project.planCount, "plan")} · ${plural(project.branchCount, "branch", "branches")}`}
							trailing={relativeTime(project.updated)}
						/>
					))}
				</div>
			)}
		</Shell>
	);
}
