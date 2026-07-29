import rehypeShiki, { type RehypeShikiOptions } from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

/**
 * Grammars to load into the highlighter.
 *
 * Naming them matters more than it looks: with no `langs`, `@shikijs/rehype`
 * defaults to every bundled language, so the first render in a process parses
 * ~200 TextMate grammars before highlighting a single line. Plans are written
 * by coding agents, so this list is what actually shows up in their fences —
 * anything else falls back to plain text rather than dragging the rest in.
 */
const LANGS: RehypeShikiOptions["langs"] = [
	"bash",
	"css",
	"diff",
	"go",
	"html",
	"ini",
	"java",
	"json",
	"jsonc",
	"jsx",
	"markdown",
	"php",
	"python",
	"ruby",
	"rust",
	"sql",
	"svelte",
	"swift",
	"toml",
	"tsx",
	"typescript",
	"vue",
	"yaml",
];

/** Identical fences recur across revisions of a plan; highlight each once. */
const fenceCache: NonNullable<RehypeShikiOptions["cache"]> = new Map();

/**
 * Raw HTML in markdown is intentionally dropped — `remark-rehype` ignores it
 * unless `allowDangerousHtml` is set, which keeps a plan from injecting script
 * into the app shell. Plans that really are HTML go through the sandboxed
 * iframe route instead.
 */
const processor = unified()
	.use(remarkParse)
	.use(remarkGfm)
	.use(remarkRehype)
	.use(rehypeSlug)
	.use(rehypeShiki, {
		themes: {
			light: "github-light",
			dark: "github-dark",
		},
		langs: LANGS,
		// A fence in some language nobody loaded is still readable as plain text;
		// it is not a reason to fail the whole page.
		fallbackLanguage: "text",
		cache: fenceCache,
	})
	.use(rehypeStringify);

export async function renderMarkdown(body: string): Promise<string> {
	const file = await processor.process(body);
	return String(file);
}

/**
 * The highlighter is a lazily-built singleton, so whoever renders first pays
 * for oniguruma and every grammar above. Doing it at import time moves that off
 * the first request and onto process start, where nobody is waiting.
 */
void renderMarkdown("```ts\nconst warm = true;\n```");

/** Enough plans to cover a browsing session without growing unbounded. */
const MAX_CACHED_PLANS = 64;
const renderedPlans = new Map<string, string>();

/**
 * Rendering is pure in the plan's content, and `updated` changes whenever that
 * content does — so the key doubles as the invalidation. Per-process, which is
 * all a cache can be here: there is no shared one on the deployment.
 */
export async function renderPlanBody(key: string, body: string): Promise<string> {
	const hit = renderedPlans.get(key);
	if (hit !== undefined) {
		// Re-inserting moves the key to the end of the iteration order, which is
		// what makes the eviction below least-recently-used rather than oldest.
		renderedPlans.delete(key);
		renderedPlans.set(key, hit);
		return hit;
	}

	const html = await renderMarkdown(body);
	renderedPlans.set(key, html);
	if (renderedPlans.size > MAX_CACHED_PLANS) {
		const oldest = renderedPlans.keys().next().value;
		if (oldest !== undefined) renderedPlans.delete(oldest);
	}
	return html;
}

/**
 * The page header already shows the title, and it's usually derived from the
 * body's own opening `# ` — drop the duplicate rather than rendering it twice.
 */
export function stripLeadingTitle(body: string, title: string): string {
	const lines = body.split("\n");
	let index = 0;
	while (index < lines.length && lines[index]?.trim() === "") index++;

	const heading = lines[index]?.match(/^#\s+(.+?)\s*#*\s*$/)?.[1]?.trim();
	if (heading === undefined || heading !== title.trim()) return body;

	return lines.slice(index + 1).join("\n");
}
