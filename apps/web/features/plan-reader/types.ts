import type { ReviewSeverity } from "@/features/review-sections";

export interface PlanOutlineItem {
	id: string;
	text: string;
	depth: number;
	/** Set when the heading opens a review section (Blockers, Should fix, Nits). */
	severity?: ReviewSeverity;
}

export interface PlanTaskProgress {
	done: number;
	total: number;
	percentage: number;
}

export interface PlanReviewCount {
	/** Anchor of the section heading, for the summary chip to link to. */
	id: string;
	severity: ReviewSeverity;
	count: number;
}

export interface PlanReaderData {
	body: string;
	outline: PlanOutlineItem[];
	hiddenOutlineItems: number;
	sectionCount: number;
	readMinutes: number;
	taskProgress?: PlanTaskProgress;
	/** Present only when the plan has at least one review section; most severe first. */
	review?: PlanReviewCount[];
}
