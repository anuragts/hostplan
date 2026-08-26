export interface PlanOutlineItem {
	id: string;
	text: string;
	depth: number;
}

export interface PlanTaskProgress {
	done: number;
	total: number;
	percentage: number;
}

export interface PlanReaderData {
	body: string;
	outline: PlanOutlineItem[];
	hiddenOutlineItems: number;
	sectionCount: number;
	readMinutes: number;
	taskProgress?: PlanTaskProgress;
}
