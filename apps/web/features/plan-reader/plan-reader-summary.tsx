import { describeSeverityCount } from "@/features/review-sections";
import type { PlanReaderData } from "./types";

export function PlanReaderSummary({ data }: { data: PlanReaderData }) {
	const { readMinutes, sectionCount, taskProgress, review } = data;
	if (readMinutes === 0 && sectionCount === 0 && taskProgress === undefined) return null;

	return (
		<section className="plan-reader-summary" aria-label="Plan reading details">
			<div className="plan-reader-stats">
				{readMinutes > 0 && <span>{readMinutes} min read</span>}
				{sectionCount > 0 && (
					<span>
						{sectionCount} {sectionCount === 1 ? "section" : "sections"}
					</span>
				)}
				{taskProgress !== undefined && (
					<span>
						{taskProgress.done} of {taskProgress.total} tasks complete
					</span>
				)}
			</div>
			{taskProgress !== undefined && (
				<div
					className="plan-reader-progress"
					role="progressbar"
					aria-label="Plan task progress"
					aria-valuemin={0}
					aria-valuemax={taskProgress.total}
					aria-valuenow={taskProgress.done}
					aria-valuetext={`${taskProgress.done} of ${taskProgress.total} tasks complete`}
				>
					<span style={{ width: `${taskProgress.percentage}%` }} />
				</div>
			)}
			{review !== undefined && (
				<ul className="plan-review-summary" aria-label="Review findings by severity">
					{review.map((item) => (
						<li key={item.id}>
							<a href={`#${item.id}`} data-severity={item.severity} data-findings={item.count}>
								{describeSeverityCount(item.severity, item.count)}
							</a>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
