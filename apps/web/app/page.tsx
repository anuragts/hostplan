import { displayPath, storeRoot, summarizeProjects } from "@hostplan/core";
import { Dashboard } from "@/components/dashboard";
import { Landing } from "@/components/landing";
import { Empty, PageTitle, Row, Shell } from "@/components/shell";
import { currentViewer } from "@/lib/current-viewer";
import { plural, relativeTime } from "@/lib/format";
import { isRemoteStore, planStoreFor } from "@/lib/store";

// The store changes underneath us constantly; a cached page is a wrong page.
export const dynamic = "force-dynamic";

export default async function HomePage() {
	// One route, three audiences: a signed-in account gets their own plans, the
	// legacy single-owner gets the whole store, everyone else gets the pitch.
	// Splitting on who is asking rather than on NODE_ENV keeps every branch
	// reachable in development.
	const viewer = await currentViewer();
	if (viewer.kind === "anonymous") return <Landing />;

	const store = planStoreFor(viewer);
	if (viewer.kind === "user") {
		return <Dashboard email={viewer.email} plans={await store.list()} />;
	}

	const plans = await store.list();
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
