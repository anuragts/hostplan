import { parseTasks } from "@hostplan/core";
import GithubSlugger from "github-slugger";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { stripLeadingTitle } from "@/lib/render";
import type { PlanOutlineItem, PlanReaderData } from "./types";

const WORDS_PER_MINUTE = 220;
const MAX_OUTLINE_ITEMS = 20;

interface MarkdownNode {
	type: string;
	value?: string;
	alt?: string;
	depth?: number;
	children?: MarkdownNode[];
}

const markdownParser = unified().use(remarkParse);

function nodeText(node: MarkdownNode): string {
	if (node.type === "image") return node.alt ?? "";
	if (node.value !== undefined) return node.value;
	return (node.children ?? []).map(nodeText).join("");
}

function readingText(node: MarkdownNode): string {
	if (node.type === "code" || node.type === "html" || node.type === "yaml") return "";
	if (node.value !== undefined) return node.value;
	return (node.children ?? []).map(readingText).join(" ");
}

function collectHeadings(
	node: MarkdownNode,
	slugger: GithubSlugger,
	headings: PlanOutlineItem[],
): void {
	if (node.type === "heading" && node.depth !== undefined) {
		const text = nodeText(node).replace(/\s+/g, " ").trim();
		const id = slugger.slug(text);
		if (text.length > 0) headings.push({ id, text, depth: node.depth });
	}

	for (const child of node.children ?? []) collectHeadings(child, slugger, headings);
}

function countWords(text: string): number {
	return text.match(/[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

export function getPlanReaderData(source: string, title: string): PlanReaderData {
	const body = stripLeadingTitle(source, title);
	const tree = markdownParser.parse(body) as MarkdownNode;
	const headings: PlanOutlineItem[] = [];
	collectHeadings(tree, new GithubSlugger(), headings);

	const shallowestDepth = Math.min(...headings.map((heading) => heading.depth));
	const primaryHeadings = headings.filter((heading) => heading.depth === shallowestDepth);
	const outlineCandidates = primaryHeadings.length >= 3 ? primaryHeadings : headings;
	const outline = outlineCandidates.slice(0, MAX_OUTLINE_ITEMS);

	const tasks = parseTasks(body);
	const done = tasks.filter((task) => task.done).length;
	const wordCount = countWords(readingText(tree));

	return {
		body,
		outline,
		hiddenOutlineItems: Math.max(0, outlineCandidates.length - outline.length),
		sectionCount: headings.length,
		readMinutes: wordCount === 0 ? 0 : Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE)),
		...(tasks.length === 0
			? {}
			: {
					taskProgress: {
						done,
						total: tasks.length,
						percentage: Math.round((done / tasks.length) * 100),
					},
				}),
	};
}
