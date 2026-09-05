import type { Heading, Parent, PhrasingContent, Root, RootContent } from "mdast";
import {
	describeFindings,
	LEADING_EMOJI,
	parseReviewHeading,
	type ReviewSeverity,
} from "./severity";

export interface ReviewSection {
	severity: ReviewSeverity;
	label: string;
	heading: Heading;
	/** Numbered sub-headings if the section has any, else top-level list items. */
	findings: number;
	/** Index range in `root.children`: the heading through the last node before the next peer heading. */
	start: number;
	end: number;
}

function textOf(node: Parent | PhrasingContent | RootContent): string {
	if ("value" in node) return node.value;
	if ("children" in node) return node.children.map(textOf).join("");
	return "";
}

function countFindings(body: RootContent[], depth: number): number {
	const subheadings = body.filter((node) => node.type === "heading" && node.depth === depth + 1);
	if (subheadings.length > 0) return subheadings.length;
	const list = body.find((node) => node.type === "list");
	return list?.children.length ?? 0;
}

/**
 * A review section runs from a severity heading to the next heading at the
 * same or a shallower depth. Only top-level headings count; a "Nits" heading
 * quoted inside a blockquote is someone else's review.
 */
export function collectReviewSections(tree: Root): ReviewSection[] {
	const sections: ReviewSection[] = [];
	const nodes = tree.children;

	for (let index = 0; index < nodes.length; index++) {
		const node = nodes[index];
		if (node?.type !== "heading") continue;
		const review = parseReviewHeading(textOf(node));
		if (review === undefined) continue;

		let end = index + 1;
		while (end < nodes.length) {
			const next = nodes[end];
			if (next?.type === "heading" && next.depth <= node.depth) break;
			end++;
		}

		sections.push({
			...review,
			heading: node,
			findings: countFindings(nodes.slice(index + 1, end), node.depth),
			start: index,
			end,
		});
		index = end - 1;
	}

	return sections;
}

/**
 * Custom mdast nodes. `remark-rehype` reads `data.hName`/`data.hProperties`
 * (typed on mdast's `Data` by mdast-util-to-hast), emits the named element,
 * and processes the children as usual.
 */
interface ReviewSectionNode extends Parent {
	type: "reviewSection";
	children: RootContent[];
}

interface ReviewHeadNode extends Parent {
	type: "reviewHead";
	children: RootContent[];
}

interface ReviewCountNode extends Parent {
	type: "reviewCount";
	children: PhrasingContent[];
}

declare module "mdast" {
	interface RootContentMap {
		reviewSection: ReviewSectionNode;
		reviewHead: ReviewHeadNode;
		reviewCount: ReviewCountNode;
	}
}

function stripEmoji(heading: Heading): void {
	const first = heading.children[0];
	if (first?.type !== "text") return;
	first.value = first.value.replace(LEADING_EMOJI, "");
	if (first.value.length === 0) heading.children.shift();
}

/**
 * Wraps each review section so CSS can paint the severity rail, and puts a
 * findings count beside the heading. The count lives outside the heading
 * element so `rehype-slug` still derives the id from the heading text alone.
 */
export function remarkReviewSections() {
	return (tree: Root) => {
		// Splicing from the back keeps every earlier section's indices valid.
		for (const section of collectReviewSections(tree).reverse()) {
			stripEmoji(section.heading);
			const [heading, ...body] = tree.children.splice(section.start, section.end - section.start);
			if (heading === undefined) continue;

			const count: ReviewCountNode = {
				type: "reviewCount",
				data: { hName: "p", hProperties: { className: ["plan-review-count"] } },
				children: [{ type: "text", value: describeFindings(section.findings) }],
			};
			const head: ReviewHeadNode = {
				type: "reviewHead",
				data: { hName: "header", hProperties: { className: ["plan-review-head"] } },
				children: [heading, count],
			};
			const wrapper: ReviewSectionNode = {
				type: "reviewSection",
				data: {
					hName: "section",
					hProperties: {
						className: ["plan-review"],
						dataSeverity: section.severity,
						dataFindings: section.findings,
					},
				},
				children: [head, ...body],
			};
			tree.children.splice(section.start, 0, wrapper);
		}
	};
}
