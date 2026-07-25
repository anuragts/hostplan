import { displayPath, storeRoot } from "@hostplan/core";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default function PlanNotFound() {
	return (
		<Shell crumbs={[{ label: "not found" }]}>
			<h1 className="text-2xl font-semibold tracking-tight text-ink">No plan with that id</h1>
			<p className="mt-3 text-sm text-ink-muted">
				Nothing in the store matches it — it may have been removed with{" "}
				<code className="font-mono text-ink">hsp rm</code>. Run{" "}
				<code className="font-mono text-ink">hsp list --all</code> to see what is stored.
			</p>
			{/* Where we looked is the part that's actually useful to debug. */}
			<p className="mt-4 font-mono text-xs text-ink-faint">{displayPath(storeRoot())}</p>
		</Shell>
	);
}
