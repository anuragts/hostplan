/**
 * The immutable component layer for custom-html-v1. It is injected into the
 * rendered copy before author styles, so a plan can art-direct with tokens or
 * low-specificity overrides without duplicating basic layout CSS.
 */
export const CUSTOM_HTML_COMPONENT_CSS = `
:root {
  color-scheme: light;
  --hp-canvas: #f0f1f3;
  --hp-surface: #ffffff;
  --hp-surface-raised: #f7f8fa;
  --hp-text: #18191c;
  --hp-text-muted: #656a73;
  --hp-line: rgba(24, 25, 28, 0.12);
  --hp-accent: #176c5b;
  --hp-success: #18794e;
  --hp-warning: #9a5d09;
  --hp-danger: #b4233c;
  --hp-info: #1769aa;
  --hp-space-1: 0.25rem;
  --hp-space-2: 0.5rem;
  --hp-space-3: 0.75rem;
  --hp-space-4: 1rem;
  --hp-space-6: 1.5rem;
  --hp-space-8: 2rem;
  --hp-radius-sm: 0.375rem;
  --hp-radius-md: 0.625rem;
  --hp-radius-lg: 0.875rem;
  --hp-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.05), 0 18px 48px -34px rgba(0, 0, 0, 0.28);
  --hp-font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --hp-font-serif: ui-serif, Georgia, "Times New Roman", serif;
  --hp-font-mono: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  --hp-measure: 72ch;
  --hp-content: 76rem;
}

:root[data-hp-mode="dark"] {
  color-scheme: dark;
  --hp-canvas: #0f1012;
  --hp-surface: #17181b;
  --hp-surface-raised: #1d1f23;
  --hp-text: #f0f1f3;
  --hp-text-muted: #a3a7af;
  --hp-line: rgba(255, 255, 255, 0.12);
  --hp-accent: #70d7d1;
  --hp-success: #77cf8b;
  --hp-warning: #e2bb5f;
  --hp-danger: #ee7785;
  --hp-info: #7eb7ff;
  --hp-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06), 0 1px 2px rgba(0, 0, 0, 0.45), 0 20px 58px -36px rgba(0, 0, 0, 0.8);
}

* { box-sizing: border-box; }
html { background: var(--hp-canvas); font-family: var(--hp-font-sans); -webkit-font-smoothing: antialiased; }
body { margin: 0; background: var(--hp-canvas); color: var(--hp-text); line-height: 1.65; }
h1, h2, h3 { margin: 0; color: var(--hp-text); line-height: 1.15; text-wrap: balance; }
p, li, figcaption { text-wrap: pretty; }
a { color: var(--hp-accent); text-underline-offset: 0.18em; }
a:focus-visible, summary:focus-visible { outline: 2px solid var(--hp-accent); outline-offset: 3px; border-radius: var(--hp-radius-sm); }
code, pre { font-family: var(--hp-font-mono); }

:where(.hp-page) { width: min(100%, var(--hp-content)); min-height: 100dvh; margin-inline: auto; padding: clamp(1.25rem, 4vw, 3.5rem); }
:where(.hp-stack) { display: flex; flex-direction: column; gap: var(--hp-stack-gap, var(--hp-space-6)); }
:where(.hp-cluster) { display: flex; flex-wrap: wrap; align-items: center; gap: var(--hp-cluster-gap, var(--hp-space-3)); }
:where(.hp-grid) { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); gap: var(--hp-grid-gap, var(--hp-space-4)); }
:where(.hp-split) { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--hp-grid-gap, var(--hp-space-4)); }
:where(.hp-section) { display: flex; flex-direction: column; gap: var(--hp-space-4); }

:where(.hp-card) { background: var(--hp-surface); border-radius: var(--hp-radius-lg); box-shadow: var(--hp-shadow); overflow: hidden; }
:where(.hp-card-header) { padding: var(--hp-space-4) var(--hp-space-6); border-bottom: 1px solid var(--hp-line); }
:where(.hp-card-title) { font-size: 0.875rem; font-weight: 680; letter-spacing: 0.045em; text-transform: uppercase; }
:where(.hp-card-body) { padding: var(--hp-space-6); }
:where(.hp-card-body) > :first-child { margin-top: 0; }
:where(.hp-card-body) > :last-child { margin-bottom: 0; }

:where(.hp-stat-grid) { display: grid; grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr)); gap: var(--hp-space-3); }
:where(.hp-stat) { display: flex; flex-direction: column; gap: var(--hp-space-2); min-height: 7.5rem; padding: var(--hp-space-4); background: var(--hp-surface); border-radius: var(--hp-radius-md); box-shadow: 0 0 0 1px var(--hp-line); }
:where(.hp-stat-value) { font-size: clamp(1.75rem, 5vw, 2.5rem); font-weight: 720; line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: -0.04em; }
:where(.hp-stat-label) { color: var(--hp-text-muted); font-size: 0.75rem; font-weight: 650; letter-spacing: 0.06em; text-transform: uppercase; }

:where(.hp-list) { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
:where(.hp-list-item) { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; gap: var(--hp-space-3); padding-block: var(--hp-space-3); border-bottom: 1px solid var(--hp-line); }
:where(.hp-list-item):last-child { border-bottom: 0; }
:where(.hp-list-main) { min-width: 0; font-weight: 600; overflow-wrap: anywhere; }
:where(.hp-list-meta) { color: var(--hp-text-muted); font-size: 0.875rem; font-weight: 400; }
:where(.hp-list-status) { color: var(--hp-text-muted); font-family: var(--hp-font-mono); font-size: 0.75rem; }

:where(.hp-badge) { display: inline-flex; min-height: 1.75rem; align-items: center; width: fit-content; padding: 0.2rem 0.55rem; color: var(--hp-text-muted); background: color-mix(in srgb, currentColor 9%, transparent); border-radius: 999px; font-family: var(--hp-font-mono); font-size: 0.72rem; font-weight: 650; line-height: 1; }
:where(.hp-callout) { padding: var(--hp-space-4); color: var(--hp-text); background: color-mix(in srgb, var(--hp-info) 9%, var(--hp-surface)); border-left: 3px solid var(--hp-info); border-radius: var(--hp-radius-md); }
:where([data-tone="info"]) { color: var(--hp-info); }
:where([data-tone="success"]) { color: var(--hp-success); }
:where([data-tone="warning"]) { color: var(--hp-warning); }
:where([data-tone="danger"]) { color: var(--hp-danger); }
:where(.hp-callout[data-tone="success"]) { border-color: var(--hp-success); background: color-mix(in srgb, var(--hp-success) 9%, var(--hp-surface)); }
:where(.hp-callout[data-tone="warning"]) { border-color: var(--hp-warning); background: color-mix(in srgb, var(--hp-warning) 9%, var(--hp-surface)); }
:where(.hp-callout[data-tone="danger"]) { border-color: var(--hp-danger); background: color-mix(in srgb, var(--hp-danger) 9%, var(--hp-surface)); }

:where(.hp-steps) { counter-reset: hp-step; display: flex; flex-direction: column; gap: var(--hp-space-4); margin: 0; padding: 0; list-style: none; }
:where(.hp-step) { counter-increment: hp-step; display: grid; grid-template-columns: 2rem minmax(0, 1fr); gap: var(--hp-space-3); align-items: start; }
:where(.hp-step)::before { content: counter(hp-step); display: grid; place-items: center; width: 2rem; height: 2rem; color: var(--hp-accent); background: color-mix(in srgb, var(--hp-accent) 12%, transparent); border-radius: 50%; font-family: var(--hp-font-mono); font-size: 0.75rem; font-weight: 700; font-variant-numeric: tabular-nums; }
:where(.hp-table) { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
:where(.hp-table) th, :where(.hp-table) td { padding: var(--hp-space-3); border-bottom: 1px solid var(--hp-line); text-align: left; vertical-align: top; }
:where(.hp-table) th { color: var(--hp-text-muted); font-size: 0.72rem; letter-spacing: 0.06em; text-transform: uppercase; }
:where(.hp-progress) { width: 100%; height: 0.5rem; overflow: hidden; accent-color: var(--hp-accent); border-radius: 999px; }

:where(.hp-kicker) { margin: 0; color: var(--hp-accent); font-family: var(--hp-font-mono); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; }
:where(.hp-lede) { max-width: var(--hp-measure); margin: 0; color: var(--hp-text-muted); font-size: clamp(1rem, 2vw, 1.2rem); }
:where(.hp-divider) { width: 100%; height: 1px; border: 0; background: var(--hp-line); }
:where(.hp-code) { padding: 0.12em 0.38em; background: var(--hp-surface-raised); border-radius: var(--hp-radius-sm); font-size: 0.88em; }
:where(.hp-caption) { color: var(--hp-text-muted); font-size: 0.78rem; }

@media (max-width: 640px) {
  :where(.hp-split) { grid-template-columns: minmax(0, 1fr); }
  :where(.hp-card-header), :where(.hp-card-body) { padding: var(--hp-space-4); }
  :where(.hp-list-item) { grid-template-columns: minmax(0, 1fr); gap: var(--hp-space-1); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}

@media print {
  :root { color-scheme: light; --hp-canvas: #fff; --hp-surface: #fff; --hp-surface-raised: #f5f5f5; --hp-text: #111; --hp-text-muted: #555; --hp-line: rgba(0, 0, 0, 0.16); --hp-shadow: 0 0 0 1px var(--hp-line); }
  :where(.hp-page) { width: 100%; min-height: 0; padding: 0; }
  :where(.hp-card), :where(.hp-stat) { break-inside: avoid; }
}
`;
