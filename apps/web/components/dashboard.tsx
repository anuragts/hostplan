"use client";

import type { PlanStatus, StoredPlan } from "@hostplan/core";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Empty, PageTitle, Row, Shell } from "@/components/shell";
import { StatusBadge } from "@/components/status-badge";
import { plural, relativeTime } from "@/lib/format";

const SETTLED_PAGE = 10;

// Client component, so this can't come from @hostplan/core (which drags in
// node builtins). Must agree with core's isSettled.
function isSettled(status: PlanStatus): boolean {
	return status === "done" || status === "superseded";
}

function matchesQuery(plan: StoredPlan, query: string): boolean {
	const haystack =
		`${plan.meta.title} ${plan.meta.project} ${plan.meta.branch} ${plan.meta.id}`.toLowerCase();
	return query
		.toLowerCase()
		.split(/\s+/)
		.every((term) => haystack.includes(term));
}

function PlanRow({ plan }: { plan: StoredPlan }) {
	return (
		<Row
			href={`/p/${plan.meta.id}`}
			title={plan.meta.title}
			meta={
				<span className="flex items-center gap-2">
					<StatusBadge status={plan.meta.status} />
					<span>
						{plan.meta.branch} · {plan.meta.visibility}
						{plan.meta.visibility === "private" && plan.meta.code !== undefined
							? ` ${plan.meta.code}`
							: ""}
					</span>
				</span>
			}
			trailing={relativeTime(plan.meta.updated)}
		/>
	);
}

/**
 * What a signed-in user sees at `/`. Live plans up top, grouped by project;
 * settled plans (done or superseded) fold away into their own section so the
 * dashboard reads as "what's in flight", not "everything I ever planned".
 */
export function Dashboard({ email, plans }: { email: string; plans: StoredPlan[] }) {
	const [query, setQuery] = useState("");
	const [settledOpen, setSettledOpen] = useState(true);
	const [settledShown, setSettledShown] = useState(SETTLED_PAGE);

	const searching = query.trim().length > 0;
	const visible = useMemo(
		() => (searching ? plans.filter((plan) => matchesQuery(plan, query.trim())) : plans),
		[plans, query, searching],
	);

	const active = visible.filter((plan) => !isSettled(plan.meta.status));
	const settled = visible.filter((plan) => isSettled(plan.meta.status));
	// A search should show every hit; paging is for the idle view.
	const settledVisible = searching ? settled : settled.slice(0, settledShown);
	const settledHidden = settled.length - settledVisible.length;

	const byProject = new Map<string, StoredPlan[]>();
	for (const plan of active) {
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
				subtitle={`${email} · ${plural(plans.length, "plan")}, ${plural(active.length, "active plan")}`}
			/>

			<input
				type="search"
				value={query}
				onChange={(event) => setQuery(event.target.value)}
				placeholder="Search all plans — title, project, branch, id…"
				className="mb-8 w-full rounded-lg border border-line bg-surface-raised/40 px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
			/>

			{plans.length === 0 ? (
				<Empty message="Nothing here yet." hint="hsp login && hsp add PLAN.md" />
			) : visible.length === 0 ? (
				<Empty message={`Nothing matches “${query.trim()}”.`} />
			) : (
				<>
					<div className="space-y-8">
						{[...byProject.entries()].map(([project, group]) => (
							<div key={project}>
								<h2 className="mb-3 font-mono text-ink-muted text-sm">{project}</h2>
								<div className="flex flex-col gap-2">
									{group.map((plan) => (
										<PlanRow key={plan.meta.id} plan={plan} />
									))}
								</div>
							</div>
						))}
					</div>

					{settled.length > 0 && (
						<div className="mt-12">
							<button
								type="button"
								onClick={() => setSettledOpen(!settledOpen)}
								className="mb-3 flex w-full items-center gap-3 text-left"
							>
								<span className="font-mono text-ink-faint text-sm">Settled · {settled.length}</span>
								<span className="h-px flex-1 bg-line" />
								<span className="font-mono text-ink-faint text-xs">{settledOpen ? "▾" : "▸"}</span>
							</button>
							{settledOpen && (
								<div className="flex flex-col gap-2 opacity-70">
									{settledVisible.map((plan) => (
										<PlanRow key={plan.meta.id} plan={plan} />
									))}
									{settledHidden > 0 && (
										<button
											type="button"
											onClick={() => setSettledShown(settledShown + 25)}
											className="rounded-lg border border-dashed border-line px-4 py-2.5 font-mono text-ink-faint text-xs transition-colors hover:border-ink-faint hover:text-ink-muted"
										>
											Show {Math.min(25, settledHidden)} more ({settledHidden} settled hidden)
										</button>
									)}
								</div>
							)}
						</div>
					)}
				</>
			)}

			<p className="mt-12 text-ink-faint text-sm">
				<Link href="/settings/tokens" className="transition-colors hover:text-ink-muted">
					CLI tokens →
				</Link>
			</p>
		</Shell>
	);
}
