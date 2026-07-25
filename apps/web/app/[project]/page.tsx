import { listPlans, summarizeBranches } from "@hostplan/core";
import { notFound } from "next/navigation";
import { PageTitle, Row, Shell } from "@/components/shell";
import { plural, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ project: string }> }) {
	const { project: projectDir } = await params;
	const dir = decodeURIComponent(projectDir);

	// Match on the directory name, which is exactly what the URL segment is.
	const plans = (await listPlans()).filter((plan) => plan.projectDir === dir);
	if (plans.length === 0) notFound();

	const name = plans[0]?.meta.project ?? dir;
	const branches = summarizeBranches(plans);

	return (
		<Shell crumbs={[{ label: name }]}>
			<PageTitle
				title={name}
				subtitle={`${plural(branches.length, "branch", "branches")} · ${plural(plans.length, "plan")}`}
			/>
			<div className="flex flex-col gap-2">
				{branches.map((branch) => (
					<Row
						key={branch.dir}
						href={`/${encodeURIComponent(dir)}/${encodeURIComponent(branch.dir)}`}
						title={<span className="font-mono">{branch.name}</span>}
						meta={plural(branch.planCount, "plan")}
						trailing={relativeTime(branch.updated)}
					/>
				))}
			</div>
		</Shell>
	);
}
