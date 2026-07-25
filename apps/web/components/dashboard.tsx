import type { StoredPlan } from "@hostplan/core";
import Link from "next/link";
import { Empty, PageTitle, Row, Shell } from "@/components/shell";
import { plural, relativeTime } from "@/lib/format";

/** What a signed-in user sees at `/`: their plans, newest first, grouped by project. */
export function Dashboard({ email, plans }: { email: string; plans: StoredPlan[] }) {
	const byProject = new Map<string, StoredPlan[]>();
	for (const plan of plans) {
		const bucket = byProject.get(plan.meta.project);
		if (bucket === undefined) byProject.set(plan.meta.project, [plan]);
		else bucket.push(plan);
	}

	return (
		<Shell
			crumbs={[]}
			action={
				<form action="/api/auth/signout" method="post">
					<button type="submit" className="text-ink-faint transition-colors hover:text-ink">
						Sign out
					</button>
				</form>
			}
		>
			<PageTitle
				title="Your plans"
				subtitle={`${email} · ${plural(plans.length, "plan")} across ${plural(byProject.size, "project")}`}
			/>

			{plans.length === 0 ? (
				<Empty message="Nothing here yet." hint="hsp login && hsp add PLAN.md" />
			) : (
				<div className="space-y-8">
					{[...byProject.entries()].map(([project, group]) => (
						<div key={project}>
							<h2 className="mb-3 font-mono text-ink-muted text-sm">{project}</h2>
							<div className="flex flex-col gap-2">
								{group.map((plan) => (
									<Row
										key={plan.meta.id}
										href={`/p/${plan.meta.id}`}
										title={plan.meta.title}
										meta={`${plan.meta.branch} · ${plan.meta.visibility}${plan.meta.visibility === "private" && plan.meta.code !== undefined ? ` ${plan.meta.code}` : ""}`}
										trailing={relativeTime(plan.meta.updated)}
									/>
								))}
							</div>
						</div>
					))}
				</div>
			)}

			<p className="mt-12 text-ink-faint text-sm">
				<Link href="/settings/tokens" className="transition-colors hover:text-ink-muted">
					CLI tokens →
				</Link>
			</p>
		</Shell>
	);
}
