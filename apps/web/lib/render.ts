import rehypeShiki from "@shikijs/rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

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
	.use(rehypeShiki, { theme: "github-dark" })
	.use(rehypeStringify);

export async function renderMarkdown(body: string): Promise<string> {
	const file = await processor.process(body);
	return String(file);
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
