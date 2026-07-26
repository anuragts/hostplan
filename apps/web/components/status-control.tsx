"use client";

import type { PlanStatus } from "@hostplan/core";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { STATUS_STYLES } from "@/components/status-badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * The five statuses, in workflow order, with a word on what each means — the
 * menu is where someone learns the difference between `done` and `superseded`,
 * so it says so rather than assuming.
 */
const OPTIONS: Array<{ status: PlanStatus; hint: string }> = [
	{ status: "draft", hint: "not agreed yet" },
	{ status: "approved", hint: "ready to implement" },
	{ status: "in-progress", hint: "being worked on" },
	{ status: "done", hint: "shipped — settles it" },
	{ status: "superseded", hint: "replaced — settles it" },
];

/**
 * Changes a plan's status from the UI. Settling is picking `done` or
 * `superseded`; unsettling is picking anything else, so there's one control
 * rather than a settle button and a separate un-settle button that can
 * disagree about what the current state is.
 *
 * Owner-only at the call sites, and the API enforces it again through RLS —
 * a control that isn't rendered is not a permission check.
 */
export function StatusControl({ id, status }: { id: string; status: PlanStatus }) {
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	// Shown instead of `status` while the request is in flight, so the badge
	// reacts on click rather than after a round trip.
	const [optimistic, setOptimistic] = useState<PlanStatus | undefined>();
	const [failed, setFailed] = useState(false);
	const shown = optimistic ?? status;

	function change(next: PlanStatus) {
		if (next === shown) return;
		setOptimistic(next);
		setFailed(false);
		void fetch(`/api/plans/${id}`, {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ status: next }),
		})
			.then((response) => {
				if (!response.ok) throw new Error(String(response.status));
				// Refresh rather than trust the optimistic value: the dashboard has to
				// re-sort the plan into (or out of) the settled section, and the plan
				// page recomputes whether dependents are blocked.
				startTransition(() => router.refresh());
			})
			.catch(() => {
				// Snap back to the truth. Silently keeping a status the server
				// rejected is the one outcome worth avoiding here.
				setOptimistic(undefined);
				setFailed(true);
			});
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label={`Status: ${shown}. Change it`}
				className={cn(
					"inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-xs transition-[color,border-color,opacity] duration-200 hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
					STATUS_STYLES[shown],
					pending && "opacity-60",
					failed && "border-destructive/60 text-destructive",
				)}
			>
				{shown === "in-progress" && (
					<span className="relative flex h-1.5 w-1.5">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60 motion-reduce:hidden" />
						<span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-400" />
					</span>
				)}
				{failed ? "not saved" : shown}
				<span aria-hidden className="text-[0.6rem] opacity-60">
					▾
				</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="min-w-52">
				{OPTIONS.map((option) => (
					<DropdownMenuItem
						key={option.status}
						onSelect={() => change(option.status)}
						className="gap-2 font-mono text-xs"
					>
						<span className={cn("w-24", option.status === shown && "text-brand")}>
							{option.status}
						</span>
						<span className="text-ink-faint">{option.hint}</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
