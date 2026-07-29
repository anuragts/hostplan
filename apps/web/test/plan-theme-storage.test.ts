import { describe, expect, test } from "bun:test";
import { parseStoredPlanTheme, planThemeStorageKey } from "../lib/plan-theme-storage";

describe("plan theme localStorage schema", () => {
	test("uses a versioned key scoped to one plan", () => {
		expect(planThemeStorageKey("a3f9c2")).toBe("hostplan.plan-theme.v1.a3f9c2");
	});

	test("accepts only a personal override with a built-in theme", () => {
		expect(
			parseStoredPlanTheme(
				JSON.stringify({
					theme: "editorial",
					mode: "personal",
					savedAt: "2026-07-30T00:00:00.000Z",
				}),
			),
		).toEqual({
			theme: "editorial",
			mode: "personal",
			savedAt: "2026-07-30T00:00:00.000Z",
		});
	});

	test("ignores malformed, arbitrary, and non-personal values", () => {
		expect(parseStoredPlanTheme("{")).toBeUndefined();
		expect(
			parseStoredPlanTheme(
				JSON.stringify({
					theme: "javascript:alert(1)",
					mode: "personal",
					savedAt: "now",
				}),
			),
		).toBeUndefined();
		expect(
			parseStoredPlanTheme(JSON.stringify({ theme: "editorial", mode: "shared", savedAt: "now" })),
		).toBeUndefined();
	});
});
