import { describe, expect, test } from "bun:test";
import { getPlanReaderData } from "../features/plan-reader";
import { stripLeadingTitle } from "../lib/render";

describe("plan reader data", () => {
	test("strips a repeated title at any Markdown heading depth", () => {
		expect(stripLeadingTitle("\n## Release plan\n\nContext", "Release plan")).toBe("\nContext");
		expect(stripLeadingTitle("## Different title\n\nContext", "Release plan")).toBe(
			"## Different title\n\nContext",
		);
	});

	test("derives stable outline, reading, and task progress details", () => {
		const data = getPlanReaderData(
			`## Release plan

### The problem

Words a reviewer needs to read.

### API \`MediaReference\`

- [x] Define the contract.
- [ ] Ship the reader.

#### Provider details

More context.

### The problem

Final context.
`,
			"Release plan",
		);

		expect(data.body).not.toContain("## Release plan");
		expect(data.sectionCount).toBe(4);
		expect(data.outline).toEqual([
			{ id: "the-problem", text: "The problem", depth: 3 },
			{ id: "api-mediareference", text: "API MediaReference", depth: 3 },
			{ id: "the-problem-1", text: "The problem", depth: 3 },
		]);
		expect(data.readMinutes).toBe(1);
		expect(data.taskProgress).toEqual({ done: 1, total: 2, percentage: 50 });
		expect(data.review).toBeUndefined();
	});

	test("surfaces review severities in the outline and counts them most severe first", () => {
		const data = getPlanReaderData(
			`# Review: widget

## Verdict

Fix one thing.

## 🟢 Nits

- Rename it.

## 🟡 Should fix

### 1. Off by one

Detail.

## 🔴 Blockers

None.
`,
			"Review: widget",
		);

		expect(data.outline).toEqual([
			{ id: "verdict", text: "Verdict", depth: 2 },
			{ id: "nits", text: "Nits", depth: 2, severity: "nit" },
			{ id: "should-fix", text: "Should fix", depth: 2, severity: "should-fix" },
			{ id: "blockers", text: "Blockers", depth: 2, severity: "blocker" },
		]);
		expect(data.review).toEqual([
			{ id: "blockers", severity: "blocker", count: 0 },
			{ id: "should-fix", severity: "should-fix", count: 1 },
			{ id: "nits", severity: "nit", count: 1 },
		]);
	});
});
