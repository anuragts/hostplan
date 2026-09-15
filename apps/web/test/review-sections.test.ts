import { describe, expect, test } from "bun:test";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { collectReviewSections, parseReviewHeading } from "../features/review-sections";
import { renderMarkdown } from "../lib/render";

const parse = (markdown: string) => unified().use(remarkParse).parse(markdown);

describe("review headings", () => {
	test("recognises each severity with or without an emoji marker", () => {
		expect(parseReviewHeading("🔴 Blockers")).toEqual({ severity: "blocker", label: "Blockers" });
		expect(parseReviewHeading("Must fix")).toEqual({ severity: "blocker", label: "Must fix" });
		expect(parseReviewHeading("🟡 Should fix (2)")).toEqual({
			severity: "should-fix",
			label: "Should fix (2)",
		});
		expect(parseReviewHeading("Nit: naming")).toEqual({ severity: "nit", label: "Nit: naming" });
	});

	test("leaves ordinary headings alone", () => {
		expect(parseReviewHeading("Blocker analysis")).toBeUndefined();
		expect(parseReviewHeading("1. Check icon still muted")).toBeUndefined();
		expect(parseReviewHeading("Already good")).toBeUndefined();
	});
});

describe("review sections", () => {
	test("counts numbered findings, falls back to list items, and reads None as zero", () => {
		const sections = collectReviewSections(
			parse(`## 🔴 Blockers

None.

## 🟡 Should fix

### 1. First

Detail.

### 2. Second

Detail.

## 🟢 Nits

- One.
- Two.
- Three.

## Already good

- Fine.
`),
		);

		expect(sections.map((section) => [section.severity, section.findings])).toEqual([
			["blocker", 0],
			["should-fix", 2],
			["nit", 3],
		]);
	});

	test("renders a severity-tagged section with a count beside the heading", async () => {
		const html = await renderMarkdown(`## 🟡 Should fix

### 1. First

Detail.

## Already good
`);

		expect(html).toContain(
			'<section class="plan-review" data-severity="should-fix" data-findings="1">',
		);
		expect(html).toContain('<header class="plan-review-head"><h2 id="should-fix">Should fix</h2>');
		expect(html).toContain('<p class="plan-review-count">1 finding</p>');
		expect(html).not.toContain("🟡");
		// The wrapper ends before the next peer heading.
		expect(html).toContain('</section>\n<h2 id="already-good">Already good</h2>');
	});
});
