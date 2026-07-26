import type { PlanStatus } from "@hostplan/core";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES: Record<PlanStatus, string> = {
	draft: "border-line text-ink-muted",
	approved: "border-emerald-500/40 text-emerald-400",
	"in-progress": "border-sky-500/40 text-sky-400",
	done: "border-emerald-500/25 text-emerald-500/70",
	superseded: "border-line text-ink-faint",
};

export function StatusBadge({ status }: { status: PlanStatus }) {
	return (
		<Badge
			variant="outline"
			className={cn("rounded bg-transparent font-mono text-xs", STYLES[status])}
		>
			{/* A quiet heartbeat on the one status that means "someone is on this
			    right now" — the only place the page is allowed to move on its own. */}
			{status === "in-progress" && (
				<span className="relative flex h-1.5 w-1.5">
					<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60 motion-reduce:hidden" />
					<span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-400" />
				</span>
			)}
			{status}
		</Badge>
	);
}
