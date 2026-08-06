import { describe, expect, test } from "bun:test";
import {
	CUSTOM_HTML_COMPONENT_CSS,
	CUSTOM_HTML_MAX_BYTES,
	CUSTOM_HTML_RESPONSE_HEADERS,
	CUSTOM_HTML_SKELETON,
	renderCustomHtml,
	validateCustomHtml,
} from "../src/custom-html";

const ARCHITECTURE_FIXTURE = CUSTOM_HTML_SKELETON.replace(
	'<section class="hp-grid">',
	'<section class="hp-split" aria-label="System architecture">',
).replace(
	'<div class="hp-card-body"><p>Decision-complete implementation detail.</p></div>',
	'<div class="hp-card-body"><ol class="hp-steps"><li class="hp-step">Validate at ingress</li><li class="hp-step">Render in an isolated frame</li></ol></div>',
);

describe("custom HTML profile", () => {
	test("accepts the documented skeleton", () => {
		const result = validateCustomHtml(CUSTOM_HTML_SKELETON);

		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([]);
		expect(result.warnings).toEqual([]);
	});

	test("accepts dashboard and architecture reference compositions", async () => {
		const dashboard = await Bun.file(
			new URL("../../../examples/custom-plan.html", import.meta.url),
		).text();

		expect(validateCustomHtml(dashboard).valid).toBe(true);
		expect(validateCustomHtml(ARCHITECTURE_FIXTURE).valid).toBe(true);
	});

	test("rejects executable and network-capable markup", () => {
		const unsafe = CUSTOM_HTML_SKELETON.replace(
			"<body>",
			'<body onload="alert(1)"><script>alert(1)</script><img src="https://example.com/pixel.png">',
		);
		const result = validateCustomHtml(unsafe);
		const codes = result.errors.map((issue) => issue.code);

		expect(result.valid).toBe(false);
		expect(codes).toContain("event-handler");
		expect(codes).toContain("prohibited-element");
		expect(codes).toContain("external-resource");
	});

	test("allows custom classes but warns about misspelled Hostplan primitives", () => {
		const source = CUSTOM_HTML_SKELETON.replace(
			'class="hp-card"',
			'class="project-radar hp-caard"',
		);
		const result = validateCustomHtml(source);

		expect(result.valid).toBe(true);
		expect(result.warnings.map((warning) => warning.code)).toContain("unknown-component-class");
		expect(result.warnings[0]?.message).toContain("hp-caard");
		expect(result.warnings[0]?.message).not.toContain("project-radar");
	});

	test("injects versioned components before author styles only in the rendered copy", () => {
		const rendered = renderCustomHtml(CUSTOM_HTML_SKELETON);

		expect(rendered).toContain('data-hostplan-components="custom-html-v1"');
		expect(rendered).toContain(CUSTOM_HTML_COMPONENT_CSS.slice(0, 80));
		expect(rendered.indexOf("data-hostplan-components")).toBeLessThan(
			rendered.indexOf(":root { --hp-accent"),
		);
		expect(CUSTOM_HTML_SKELETON).not.toContain("data-hostplan-components");
	});

	test("recognizes profile metadata regardless of attribute order", () => {
		const reversed = CUSTOM_HTML_SKELETON.replace(
			'name="hostplan-profile" content="custom-html-v1"',
			'content="custom-html-v1" name="hostplan-profile"',
		);

		expect(validateCustomHtml(reversed).valid).toBe(true);
		expect(renderCustomHtml(reversed)).toContain("data-hostplan-components");
	});

	test("requires an explicit head so render-time styles can be injected", () => {
		const source = CUSTOM_HTML_SKELETON.replace("<head>", "").replace("</head>", "");
		const result = validateCustomHtml(source);

		expect(result.valid).toBe(false);
		expect(result.errors.some((candidate) => candidate.code === "missing-head")).toBe(true);
	});

	test("enforces the source limit and reports accessibility guidance as warnings", () => {
		const oversized = CUSTOM_HTML_SKELETON.replace(
			"</main>",
			`<p>${"x".repeat(CUSTOM_HTML_MAX_BYTES)}</p></main>`,
		);
		const withoutGuidance = CUSTOM_HTML_SKELETON.replace(
			"@media print { .screen-only { display: none; } }",
			"",
		).replace("</main>", '<table class="hp-table"><tr><td>Risk</td></tr></table></main>');

		expect(validateCustomHtml(oversized).errors.map((candidate) => candidate.code)).toContain(
			"source-too-large",
		);
		expect(validateCustomHtml(withoutGuidance).warnings.map((candidate) => candidate.code)).toEqual(
			expect.arrayContaining(["missing-print-style", "missing-table-caption"]),
		);
	});

	test("ships a defense-in-depth sandbox policy", () => {
		const policy = CUSTOM_HTML_RESPONSE_HEADERS["content-security-policy"];
		expect(policy).toContain("sandbox");
		expect(policy).toContain("script-src 'none'");
		expect(policy).toContain("connect-src 'none'");
		expect(policy).toContain("form-action 'none'");
	});
});
