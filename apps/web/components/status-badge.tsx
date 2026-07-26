import type { PlanStatus } from "@hostplan/core";

const STYLES: Record<PlanStatus, string> = {
	draft: "border-line text-ink-muted",
	approved: "border-emerald-500/40 text-emerald-400",
	"in-progress": "border-sky-500/40 text-sky-400",
	done: "border-emerald-500/25 text-emerald-500/70",
	superseded: "border-line text-ink-faint",
};

export function StatusBadge({ status }: { status: PlanStatus }) {
	return (
		<span className={`rounded border px-2 py-0.5 font-mono text-xs ${STYLES[status]}`}>
			{status}
		</span>
	);
}
