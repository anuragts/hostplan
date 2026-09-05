/**
 * Review plans sort findings under a fixed set of headings. Adding a severity
 * is one entry here: the reader, the outline, and the summary all key off it.
 * Order is display order, most severe first.
 */
export const REVIEW_SEVERITIES = ["blocker", "should-fix", "nit"] as const;

export type ReviewSeverity = (typeof REVIEW_SEVERITIES)[number];

interface SeverityRule {
	/**
	 * Matched against the heading text with any leading emoji removed. The label
	 * must be the whole heading, or be followed by a count or colon, so a
	 * heading such as "Blocker analysis" stays ordinary prose.
	 */
	pattern: RegExp;
	noun: { one: string; other: string };
}

const RULES: Record<ReviewSeverity, SeverityRule> = {
	blocker: {
		pattern: /^(?:blockers?|must[ -]fix)\s*(?:[(:]|$)/i,
		noun: { one: "blocker", other: "blockers" },
	},
	"should-fix": {
		pattern: /^should[ -]fix\s*(?:[(:]|$)/i,
		noun: { one: "should fix", other: "should fix" },
	},
	nit: {
		pattern: /^nits?\s*(?:[(:]|$)/i,
		noun: { one: "nit", other: "nits" },
	},
};

/**
 * Authors mark severity with a coloured circle (🔴 🟡 🟢). The viewer paints
 * its own marker, so the emoji is stripped from headings and ids. Only
 * pictographs count: `Emoji_Component` would also eat the digit in "1. Title".
 */
export const LEADING_EMOJI = /^(?:(?:\p{Extended_Pictographic}|\uFE0F|\u200D)+\s*)+/u;

export interface ReviewHeading {
	severity: ReviewSeverity;
	/** The heading text without its emoji marker. */
	label: string;
}

export function parseReviewHeading(text: string): ReviewHeading | undefined {
	const label = text.replace(LEADING_EMOJI, "").trim();
	const severity = REVIEW_SEVERITIES.find((candidate) => RULES[candidate].pattern.test(label));
	return severity === undefined ? undefined : { severity, label };
}

/** "1 blocker", "2 should fix", "no nits" — for the summary chips. */
export function describeSeverityCount(severity: ReviewSeverity, count: number): string {
	const { noun } = RULES[severity];
	if (count === 0) return `no ${noun.other}`;
	return `${count} ${count === 1 ? noun.one : noun.other}`;
}

/** "none", "1 finding", "3 findings" — for the chip beside a section heading. */
export function describeFindings(count: number): string {
	if (count === 0) return "none";
	return `${count} ${count === 1 ? "finding" : "findings"}`;
}
