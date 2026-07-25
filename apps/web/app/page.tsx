import { displayPath, storeRoot, summarizeProjects } from "@hostplan/core";
import { Landing } from "@/components/landing";
import { Empty, PageTitle, Row, Shell } from "@/components/shell";
import { isOwnerSession } from "@/lib/auth";
import { plural, relativeTime } from "@/lib/format";
import { isRemoteStore, planStore } from "@/lib/store";

// The store changes underneath us constantly; a cached page is a wrong page.
export const dynamic = "force-dynamic";

export default async function HomePage() {
	// `/` is the one route that serves two audiences: the owner's index, and the
	// pitch for everyone else. Splitting on who is asking rather than on NODE_ENV
	// keeps both halves reachable in development — unset HSP_TOKEN and you are
	// the owner, set it and sign out to see what a visitor sees.
	if (!(await isOwnerSession())) return <Landing />;

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
