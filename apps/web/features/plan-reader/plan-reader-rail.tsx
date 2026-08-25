import { OpenIn } from "@/components/open-in";
import type { OpenTarget } from "@/lib/providers";
import { PlanOutline } from "./plan-outline";
import type { PlanReaderData } from "./types";

export function PlanReaderRail({
	data,
	targets,
	planId,
}: {
	data: PlanReaderData;
	targets: OpenTarget[];
	planId: string;
}) {
	return (
		<aside className="plan-reader-rail print:hidden" aria-label="Plan navigation and actions">
			{data.outline.length >= 3 && (
				<PlanOutline items={data.outline} hiddenItems={data.hiddenOutlineItems} planId={planId} />
			)}
			<OpenIn targets={targets} embedded />
		</aside>
	);
}
