import { notFound } from "next/navigation";
import { PageTitle, Row, Shell } from "@/components/shell";
import { StatusBadge } from "@/components/status-badge";
import { plural, relativeTime } from "@/lib/format";
import { requireOwner } from "@/lib/require-owner";
import { planStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function BranchPage({
	params,
}: {
	params: Promise<{ project: string; branch: string }>;
}) {
	const raw = await params;
	const projectDir = decodeURIComponent(raw.project);
	const branchDir = decodeURIComponent(raw.branch);

	await requireOwner();
	const plans = (await planStore().list()).filter(
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
						meta={
							<span className="flex items-center gap-2">
								<StatusBadge status={plan.meta.status} />
								<span>
									{plan.meta.id} · {plan.meta.format}
								</span>
							</span>
						}
						trailing={relativeTime(plan.meta.updated)}
					/>
				))}
			</div>
		</Shell>
	);
}
