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
	});
});
