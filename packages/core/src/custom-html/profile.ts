export const CUSTOM_HTML_PROFILE = "custom-html-v1" as const;
export const CUSTOM_HTML_PROFILE_VERSION = 1;
export const CUSTOM_HTML_MAX_BYTES = 512 * 1024;

export const CUSTOM_HTML_MODES = ["light", "dark"] as const;
export type CustomHtmlMode = (typeof CUSTOM_HTML_MODES)[number];

export const CUSTOM_HTML_TONES = ["neutral", "info", "success", "warning", "danger"] as const;

export interface CustomHtmlComponent {
	name: string;
	classes: readonly string[];
	description: string;
	example: string;
}

export const CUSTOM_HTML_TOKENS = {
	color: [
		"--hp-canvas",
		"--hp-surface",
		"--hp-surface-raised",
		"--hp-text",
		"--hp-text-muted",
		"--hp-line",
		"--hp-accent",
		"--hp-success",
		"--hp-warning",
		"--hp-danger",
		"--hp-info",
	],
	spacing: [
		"--hp-space-1",
		"--hp-space-2",
		"--hp-space-3",
		"--hp-space-4",
		"--hp-space-6",
		"--hp-space-8",
	],
	shape: ["--hp-radius-sm", "--hp-radius-md", "--hp-radius-lg", "--hp-shadow"],
	typography: ["--hp-font-sans", "--hp-font-serif", "--hp-font-mono", "--hp-measure"],
} as const;

export const CUSTOM_HTML_COMPONENTS: readonly CustomHtmlComponent[] = [
	{
		name: "layout",
		classes: ["hp-page", "hp-stack", "hp-cluster", "hp-grid", "hp-split", "hp-section"],
		description: "Responsive page, flow, inline, grid, split, and section composition.",
		example: '<main class="hp-page hp-stack"><section class="hp-grid">...</section></main>',
	},
	{
		name: "card",
		classes: ["hp-card", "hp-card-header", "hp-card-title", "hp-card-body"],
		description: "A restrained surface for one decision, group, or supporting detail.",
		example:
			'<section class="hp-card"><header class="hp-card-header"><h2 class="hp-card-title">Ship now</h2></header><div class="hp-card-body">...</div></section>',
	},
	{
		name: "stat",
		classes: ["hp-stat-grid", "hp-stat", "hp-stat-value", "hp-stat-label"],
		description: "Compact summary metrics with stable tabular numerals.",
		example:
			'<div class="hp-stat-grid"><div class="hp-stat"><strong class="hp-stat-value">61</strong><span class="hp-stat-label">Ready</span></div></div>',
	},
	{
		name: "list",
		classes: ["hp-list", "hp-list-item", "hp-list-main", "hp-list-meta", "hp-list-status"],
		description: "Dense ranked or status-oriented rows that collapse cleanly on mobile.",
		example:
			'<ul class="hp-list"><li class="hp-list-item"><span class="hp-list-main">Create renderer</span><span class="hp-list-status" data-tone="success">ready</span></li></ul>',
	},
	{
		name: "status",
		classes: ["hp-badge", "hp-callout"],
		description:
			"Status labels and explanatory callouts; set data-tone to neutral, info, success, warning, or danger.",
		example: '<span class="hp-badge" data-tone="warning">blocked</span>',
	},
	{
		name: "process and data",
		classes: ["hp-steps", "hp-step", "hp-table", "hp-progress"],
		description: "Ordered work, comparison tables, and static progress summaries.",
		example: '<ol class="hp-steps"><li class="hp-step">Validate input</li></ol>',
	},
	{
		name: "supporting text",
		classes: ["hp-kicker", "hp-lede", "hp-divider", "hp-code", "hp-caption"],
		description: "Document hierarchy, code fragments, separators, and captions.",
		example: '<p class="hp-kicker">Architecture</p><p class="hp-lede">One canonical source.</p>',
	},
] as const;

export const CUSTOM_HTML_KNOWN_CLASSES: ReadonlySet<string> = new Set(
	CUSTOM_HTML_COMPONENTS.flatMap((component) => component.classes),
);

export const CUSTOM_HTML_SKELETON = `<!doctype html>
<html lang="en" data-hp-mode="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="hostplan-profile" content="custom-html-v1">
  <title>Implementation plan</title>
  <style>
    :root { --hp-accent: #77a7ff; }
    @media print { .screen-only { display: none; } }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
  </style>
</head>
<body>
  <main class="hp-page hp-stack">
    <header class="hp-stack">
      <p class="hp-kicker">Implementation plan</p>
      <h1>Plan title</h1>
      <p class="hp-lede">A concise description of the outcome.</p>
    </header>
    <section class="hp-grid">
      <article class="hp-card">
        <header class="hp-card-header"><h2 class="hp-card-title">First workstream</h2></header>
        <div class="hp-card-body"><p>Decision-complete implementation detail.</p></div>
      </article>
    </section>
  </main>
</body>
</html>`;

const COMPONENT_SUMMARY = CUSTOM_HTML_COMPONENTS.map(
	(component) => `- ${component.name}: ${component.classes.map((name) => `.${name}`).join(", ")}`,
).join("\n");

export const CUSTOM_HTML_INSTRUCTIONS = `Create one static Hostplan custom HTML document.

Response contract:
- Return raw HTML only: no Markdown fence, preamble, or trailing explanation.
- Include doctype, html[lang][data-hp-mode="light|dark"], UTF-8 charset, viewport, a meaningful title, and <meta name="hostplan-profile" content="custom-html-v1">.
- Use exactly one visible main landmark and one h1. Keep the source order semantic.
- Preserve implementation substance: outcome, scope, decisions, constraints, ordered work, verification, rollout, and open questions where relevant.
- Compose the Hostplan primitives below when useful. You may add your own classes and one inline style block. Override --hp-* tokens for art direction instead of rebuilding every primitive.
- Make the document responsive from 320px upward, printable, keyboard-readable, and respectful of prefers-reduced-motion.
- Use HTML/CSS, system fonts, and inline SVG only. No scripts, event handlers, forms, frames, embeds, remote assets, CSS imports/url(), tracking, or fake login/browser chrome.
- Keep the complete source under 512 KiB.

Hostplan primitives:
${COMPONENT_SUMMARY}

Allowed status tones: ${CUSTOM_HTML_TONES.join(", ")}.

Starter document:
${CUSTOM_HTML_SKELETON}`;
