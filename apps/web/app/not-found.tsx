import { displayPath, storeRoot } from "@hostplan/core";
import { Shell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default function NotFound() {
	return (
		<Shell crumbs={[{ label: "not found" }]}>
			<h1 className="text-2xl font-semibold tracking-tight text-ink">Nothing here</h1>
			<p className="mt-3 text-sm text-ink-muted">
				No plans matched that project or branch. They may not have been added yet.
			</p>
			<p className="mt-4 font-mono text-xs text-ink-faint">{displayPath(storeRoot())}</p>
		</Shell>
	);
}
