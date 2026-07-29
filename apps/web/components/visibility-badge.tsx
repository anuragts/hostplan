import type { PlanMeta } from "@hostplan/core";

/**
 * Shows how a plan is exposed. The code itself only renders for the owner —
 * a code holder can already read the plan and has no business reissuing links.
 */
export function VisibilityBadge({ meta, isOwner }: { meta: PlanMeta; isOwner: boolean }) {
	if (meta.visibility === "public") {
		return (
			<span className="plan-visibility-badge rounded border border-line px-2 py-0.5 font-mono text-ink-muted text-xs">
				public
			</span>
		);
	}

	return (
		<span className="plan-visibility-badge rounded border border-line px-2 py-0.5 font-mono text-ink-muted text-xs">
			private{isOwner && meta.code !== undefined ? ` · ${meta.code}` : ""}
		</span>
	);
}
