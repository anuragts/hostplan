import { parseTasks } from "@hostplan/core";
import GithubSlugger from "github-slugger";
import type { Heading, Nodes, Root } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";
import {
	collectReviewSections,
	parseReviewHeading,
	REVIEW_SEVERITIES,
} from "@/features/review-sections";
import { stripLeadingTitle } from "@/lib/render";
import type { PlanOutlineItem, PlanReaderData, PlanReviewCount } from "./types";

const WORDS_PER_MINUTE = 220;
const MAX_OUTLINE_ITEMS = 20;

const markdownParser = unified().use(remarkParse);

function nodeText(node: Nodes): string {
	if (node.type === "image") return node.alt ?? "";
	if ("value" in node) return node.value;
	return "children" in node ? node.children.map(nodeText).join("") : "";
}

function readingText(node: Nodes): string {
	if (node.type === "code" || node.type === "html" || node.type === "yaml") return "";
	if ("value" in node) return node.value;
	return "children" in node ? node.children.map(readingText).join(" ") : "";
}

/**
 * Ids must match what `rehype-slug` gives the rendered heading, so the text is
 * slugged after the same emoji strip the renderer applies to review headings.
 */
function collectHeadings(
	node: Nodes,
	slugger: GithubSlugger,
	headings: Map<Heading, PlanOutlineItem>,
): void {
	if (node.type === "heading") {
		const raw = nodeText(node).replace(/\s+/g, " ").trim();
		const review = parseReviewHeading(raw);
		const text = review?.label ?? raw;
		const id = slugger.slug(text);
		if (text.length > 0) {
			headings.set(node, {
				id,
				text,
				depth: node.depth,
				...(review === undefined ? {} : { severity: review.severity }),
			});
		}
	}

	if ("children" in node) {
		for (const child of node.children) collectHeadings(child, slugger, headings);
	}
}

function countWords(text: string): number {
	return text.match(/[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

/** Section counts in severity order, so the summary reads most severe first. */
function reviewCounts(tree: Root, headings: Map<Heading, PlanOutlineItem>): PlanReviewCount[] {
	const sections = collectReviewSections(tree);
	return REVIEW_SEVERITIES.flatMap((severity) =>
		sections.flatMap((section) => {
			const item = headings.get(section.heading);
			if (section.severity !== severity || item === undefined) return [];
			return [{ id: item.id, severity, count: section.findings }];
		}),
	);
}

export function getPlanReaderData(source: string, title: string): PlanReaderData {
	const body = stripLeadingTitle(source, title);
	const tree = markdownParser.parse(body);
	const headingMap = new Map<Heading, PlanOutlineItem>();
	collectHeadings(tree, new GithubSlugger(), headingMap);
	const headings = [...headingMap.values()];

	const shallowestDepth = Math.min(...headings.map((heading) => heading.depth));
	const primaryHeadings = headings.filter((heading) => heading.depth === shallowestDepth);
	const outlineCandidates = primaryHeadings.length >= 3 ? primaryHeadings : headings;
	const outline = outlineCandidates.slice(0, MAX_OUTLINE_ITEMS);

	const tasks = parseTasks(body);
	const done = tasks.filter((task) => task.done).length;
	const wordCount = countWords(readingText(tree));
	const review = reviewCounts(tree, headingMap);

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
		...(review.length === 0 ? {} : { review }),
	};
}
