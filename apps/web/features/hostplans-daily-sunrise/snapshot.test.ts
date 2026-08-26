import { describe, expect, test } from "bun:test";
import { compareDailySunriseSnapshots, type DailySunriseSnapshot } from "./snapshot";

function row(
	snapshotDate: string,
	overrides: Partial<DailySunriseSnapshot> = {},
): DailySunriseSnapshot {
	return {
		snapshotDate,
		scope: "overall",
		publicPath: "*",
		articleSlug: null,
		automationPrNumber: 12,
		automationCommitSha: null,
		newUsers: 10,
		returningUsers: 5,
		pageViews: 30,
		organicSearchSessions: 4,
		aiAnswerReferralSessions: 2,
		activationEvents: 3,
		insight: "Stable baseline",
		decision: "Keep measuring",
		isComplete: true,
		...overrides,
	};
}

describe("Daily Sunrise comparisons", () => {
	test("compares exactly two complete seven-day UTC windows", () => {
		const dates = Array.from({ length: 14 }, (_, index) =>
			new Date(Date.UTC(2026, 6, 30 + index)).toISOString().slice(0, 10),
		);
		const report = compareDailySunriseSnapshots(
			dates.map((date, index) => row(date, { newUsers: index < 7 ? 5 : 10 })),
			new Date("2026-08-13T18:30:00+05:30"),
		);

		expect(report.previousWindow).toEqual(["2026-07-30", "2026-08-05"]);
		expect(report.currentWindow).toEqual(["2026-08-06", "2026-08-12"]);
		expect(report.newUsers).toEqual({ current: 70, previous: 35, absolute: 35, percentage: 100 });
		expect(report.reliable).toBe(true);
		expect(report.sampleLabel).toBe("directional");
	});

	test("marks missing days unreliable and chooses the current window's best article", () => {
		const report = compareDailySunriseSnapshots(
			[
				row("2026-08-12"),
				row("2026-08-12", {
					scope: "article",
					publicPath: "/examples/hostplans-daily-sunrise/example",
					articleSlug: "example",
					pageViews: 7,
				}),
			],
			new Date("2026-08-13T00:00:00Z"),
		);

		expect(report.reliable).toBe(false);
		expect(report.missingOverallDays).toHaveLength(13);
		expect(report.bestArticle).toEqual({ slug: "example", pageViews: 7 });
		expect(report.sampleLabel).toBe("small sample");
	});
});
