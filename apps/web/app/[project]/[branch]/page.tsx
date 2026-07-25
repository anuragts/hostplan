import { listPlans } from "@hostplan/core";
import { notFound } from "next/navigation";
import { PageTitle, Row, Shell } from "@/components/shell";
import { plural, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BranchPage({
	params,
}: {
	params: Promise<{ project: string; branch: string }>;
}) {
	const raw = await params;
	const projectDir = decodeURIComponent(raw.project);
	const branchDir = decodeURIComponent(raw.branch);

	const plans = (await listPlans()).filter(
		(plan) => plan.projectDir === projectDir && plan.branchDir === branchDir,
	);
	if (plans.length === 0) notFound();

	const first = plans[0];
	const projectName = first?.meta.project ?? projectDir;
	const branchName = first?.meta.branch ?? branchDir;

	return (
		<Shell
			crumbs={[
				{ label: projectName, href: `/${encodeURIComponent(projectDir)}` },
				{ label: branchName },
			]}
		>
			<PageTitle title={branchName} subtitle={plural(plans.length, "plan")} />
			<div className="flex flex-col gap-2">
				{plans.map((plan) => (
					<Row
						key={plan.meta.id}
						href={`/p/${plan.meta.id}`}
						title={plan.meta.title}
						meta={`${plan.meta.id} · ${plan.meta.format}`}
						trailing={relativeTime(plan.meta.updated)}
					/>
				))}
			</div>
		</Shell>
	);
}
