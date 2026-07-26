"use client";

import type { PlanStatus, StoredPlan } from "@hostplan/core";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";
import { Empty, PageTitle, Shell } from "@/components/shell";
import { StatusControl } from "@/components/status-control";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
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

/**
 * A row that is a link *and* holds a control.
 *
 * The link is an overlay rather than a wrapper: a dropdown trigger nested
 * inside an `<a>` is invalid interactive content, and browsers handle the
 * resulting click ambiguity differently. So the anchor covers the row
 * underneath, and anything interactive sits above it.
 */
function RowShell({
	href,
	label,
	stagger,
	className,
	children,
}: {
	href: string;
	label: string;
	stagger?: number | undefined;
	className?: string;
	children: ReactNode;
}) {
	return (
		<div
			className={`group relative rounded-lg border transition-[border-color,background-color] duration-200 hover:border-ink-faint ${className ?? ""} ${stagger === undefined ? "" : "animate-fade-up"}`}
			style={stagger === undefined ? undefined : ({ "--stagger": `${stagger}ms` } as CSSProperties)}
		>
			<Link
				href={href}
				aria-label={label}
				className="absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
			/>
			{children}
		</div>
	);
}

function PlanRow({ plan, stagger }: { plan: StoredPlan; stagger?: number | undefined }) {
	return (
		<RowShell
			href={`/p/${plan.meta.id}`}
			label={plan.meta.title}
			stagger={stagger}
			className="border-line bg-surface-raised/40 px-4 py-3 hover:bg-surface-raised"
		>
			<div className="flex items-center gap-4">
				<div className="min-w-0 flex-1">
					<div className="truncate font-medium text-ink text-sm">{plan.meta.title}</div>
					<div className="mt-1 flex items-center gap-2 text-ink-faint text-xs">
						<StatusSlot plan={plan} />
						<span className="truncate">
							{plan.meta.branch} · {plan.meta.visibility}
							{plan.meta.visibility === "private" && plan.meta.code !== undefined
								? ` ${plan.meta.code}`
								: ""}
						</span>
					</div>
				</div>
				<div className="pointer-events-none shrink-0 font-mono text-ink-faint text-xs transition-colors group-hover:text-ink-muted">
					{relativeTime(plan.meta.updated)}
				</div>
			</div>
		</RowShell>
	);
}

/**
 * Settled plans are over, so their rows carry only what identifies them: the
 * title and how they ended. Branch, visibility and timestamps are for work in
 * flight — for the archive they're noise, and the plan page has them anyway.
 */
function SettledRow({ plan }: { plan: StoredPlan }) {
	return (
		<RowShell
			href={`/p/${plan.meta.id}`}
			label={plan.meta.title}
			className="border-line/60 px-4 py-2.5 hover:bg-surface-raised/60"
		>
			<div className="flex items-center justify-between gap-4">
				<span className="pointer-events-none truncate text-ink-muted text-sm transition-colors group-hover:text-ink">
					{plan.meta.title}
				</span>
				<StatusSlot plan={plan} />
			</div>
		</RowShell>
	);
}

/** Sits above the overlay link, so clicking the badge opens the menu, not the plan. */
function StatusSlot({ plan }: { plan: StoredPlan }) {
	return (
		<span className="relative shrink-0">
			<StatusControl id={plan.meta.id} status={plan.meta.status} />
		</span>
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

	// Rows cascade in on first paint; while typing, keys keep rows mounted so
	// nothing re-animates under the cursor.
	let entrance = 0;
	const nextStagger = () => (searching ? undefined : Math.min(entrance++ * 30, 300));

	return (
		<Shell
			crumbs={[]}
			action={
				<form action="/api/auth/signout" method="post">
					<Button type="submit" variant="ghost" size="sm" className="text-ink-faint">
						Sign out
					</Button>
				</form>
			}
		>
			<div className="animate-fade-in">
				<PageTitle
					title="Your plans"
					subtitle={`${email} · ${plural(plans.length, "plan")}, ${plural(active.length, "active plan")}`}
				/>

				<Input
					type="search"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search all plans — title, project, branch, id…"
					className="mb-8 h-10 bg-surface-raised/40 px-4 text-sm focus-visible:ring-brand/20"
				/>
			</div>

			{plans.length === 0 ? (
				<Empty message="Nothing here yet." hint="hsp login && hsp add PLAN.md" />
			) : visible.length === 0 ? (
				<div className="animate-fade-in">
					<Empty message={`Nothing matches “${query.trim()}”.`} />
				</div>
			) : (
				<>
					<div className="space-y-8">
						{[...byProject.entries()].map(([project, group]) => (
							<div key={project}>
								<h2 className="mb-3 font-mono text-ink-muted text-sm">{project}</h2>
								<div className="flex flex-col gap-2">
									{group.map((plan) => (
										<PlanRow key={plan.meta.id} plan={plan} stagger={nextStagger()} />
									))}
								</div>
							</div>
						))}
					</div>

					{settled.length > 0 && (
						<Collapsible open={settledOpen} onOpenChange={setSettledOpen} className="mt-12">
							<CollapsibleTrigger className="group mb-3 flex w-full items-center gap-3 text-left">
								<span className="font-mono text-ink-faint text-sm transition-colors group-hover:text-ink-muted">
									Settled · {settled.length}
								</span>
								<span className="h-px flex-1 bg-line transition-colors group-hover:bg-ink-faint/40" />
								<span className="font-mono text-ink-faint text-xs transition-transform duration-200 group-data-[state=closed]:-rotate-90">
									▾
								</span>
							</CollapsibleTrigger>
							<CollapsibleContent className="collapsible-content">
								<div className="flex flex-col gap-1.5 pb-1">
									{settledVisible.map((plan) => (
										<SettledRow key={plan.meta.id} plan={plan} />
									))}
									{settledHidden > 0 && (
										<Button
											variant="outline"
											onClick={() => setSettledShown(settledShown + 25)}
											className="h-auto border-dashed bg-transparent px-4 py-2.5 font-mono text-ink-faint text-xs hover:text-ink-muted"
										>
											Show {Math.min(25, settledHidden)} more ({settledHidden} settled hidden)
										</Button>
									)}
								</div>
							</CollapsibleContent>
						</Collapsible>
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
