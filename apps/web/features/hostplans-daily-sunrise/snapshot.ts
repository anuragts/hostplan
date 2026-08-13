export const DAILY_SUNRISE_TABLE = "hostplans_daily_sunrise_snapshots" as const;
export const SMALL_SAMPLE_VISITORS = 100;

export type SnapshotScope = "overall" | "public-path" | "article";

export interface DailySunriseSnapshot {
	snapshotDate: string;
	scope: SnapshotScope;
	publicPath: string;
	articleSlug: string | null;
	automationPrNumber: number | null;
	automationCommitSha: string | null;
	newUsers: number;
	returningUsers: number;
	pageViews: number;
	organicSearchSessions: number;
	aiAnswerReferralSessions: number;
	activationEvents: number;
	insight: string;
	decision: string;
	isComplete: true;
}

interface MetricChange {
	current: number;
	previous: number;
	absolute: number;
	percentage: number | null;
}

type CountMetric =
	| "newUsers"
	| "returningUsers"
	| "pageViews"
	| "organicSearchSessions"
	| "aiAnswerReferralSessions"
	| "activationEvents";

export interface DailySunriseComparison {
	currentWindow: readonly [start: string, end: string];
	previousWindow: readonly [start: string, end: string];
	reliable: boolean;
	missingOverallDays: string[];
	sampleLabel: "small sample" | "directional";
	newUsers: MetricChange;
	returningUsers: MetricChange;
	pageViews: MetricChange;
	organicSearchSessions: MetricChange;
	aiAnswerReferralSessions: MetricChange;
	activationEvents: MetricChange;
	bestArticle: { slug: string; pageViews: number } | null;
}

const DAY_MS = 86_400_000;

function dateOnly(value: Date): string {
	return value.toISOString().slice(0, 10);
}

function addUtcDays(value: Date, days: number): Date {
	return new Date(value.getTime() + days * DAY_MS);
}

function change(current: number, previous: number): MetricChange {
	return {
		current,
		previous,
		absolute: current - previous,
		percentage: previous === 0 ? null : ((current - previous) / previous) * 100,
	};
}

function datesBetween(start: Date, end: Date): string[] {
	const dates: string[] = [];
	for (let cursor = start; cursor < end; cursor = addUtcDays(cursor, 1)) {
		dates.push(dateOnly(cursor));
	}
	return dates;
}

function sum(rows: DailySunriseSnapshot[], key: CountMetric): number {
	return rows.reduce((total, row) => total + row[key], 0);
}

/** Compare the latest seven complete UTC days with the seven before them. */
export function compareDailySunriseSnapshots(
	rows: DailySunriseSnapshot[],
	now: Date,
): DailySunriseComparison {
	const currentEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
	const currentStart = addUtcDays(currentEnd, -7);
	const previousStart = addUtcDays(currentEnd, -14);
	const inWindow = (row: DailySunriseSnapshot, start: Date, end: Date) =>
		row.snapshotDate >= dateOnly(start) && row.snapshotDate < dateOnly(end);
	const overall = rows.filter((row) => row.scope === "overall" && row.isComplete);
	const current = overall.filter((row) => inWindow(row, currentStart, currentEnd));
	const previous = overall.filter((row) => inWindow(row, previousStart, currentStart));
	const observedDays = new Set([...current, ...previous].map((row) => row.snapshotDate));
	const missingOverallDays = datesBetween(previousStart, currentEnd).filter(
		(date) => !observedDays.has(date),
	);
	const articleTotals = new Map<string, number>();
	for (const row of rows.filter(
		(candidate) =>
			candidate.scope === "article" &&
			candidate.articleSlug !== null &&
			candidate.isComplete &&
			inWindow(candidate, currentStart, currentEnd),
	)) {
		const slug = row.articleSlug;
		if (slug === null) continue;
		articleTotals.set(slug, (articleTotals.get(slug) ?? 0) + row.pageViews);
	}
	const bestArticle =
		[...articleTotals.entries()]
			.sort((left, right) => right[1] - left[1])
			.map(([slug, pageViews]) => ({ slug, pageViews }))[0] ?? null;
	const currentVisitors = sum(current, "newUsers") + sum(current, "returningUsers");

	return {
		currentWindow: [dateOnly(currentStart), dateOnly(addUtcDays(currentEnd, -1))],
		previousWindow: [dateOnly(previousStart), dateOnly(addUtcDays(currentStart, -1))],
		reliable: missingOverallDays.length === 0,
		missingOverallDays,
		sampleLabel: currentVisitors < SMALL_SAMPLE_VISITORS ? "small sample" : "directional",
		newUsers: change(sum(current, "newUsers"), sum(previous, "newUsers")),
		returningUsers: change(sum(current, "returningUsers"), sum(previous, "returningUsers")),
		pageViews: change(sum(current, "pageViews"), sum(previous, "pageViews")),
		organicSearchSessions: change(
			sum(current, "organicSearchSessions"),
			sum(previous, "organicSearchSessions"),
		),
		aiAnswerReferralSessions: change(
			sum(current, "aiAnswerReferralSessions"),
			sum(previous, "aiAnswerReferralSessions"),
		),
		activationEvents: change(sum(current, "activationEvents"), sum(previous, "activationEvents")),
		bestArticle,
	};
}
