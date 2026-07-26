import type { StoredPlan } from "./store";

export interface SearchHit {
	plan: StoredPlan;
	score: number;
	/** The first body line that matched, trimmed for display. */
	excerpt?: string;
}

const EXCERPT_LENGTH = 120;

function terms(query: string): string[] {
	return query
		.toLowerCase()
		.split(/\s+/)
		.filter((term) => term.length > 0);
}

function excerptFor(body: string, needles: string[]): string | undefined {
	for (const line of body.split("\n")) {
		const haystack = line.toLowerCase();
		if (!needles.some((needle) => haystack.includes(needle))) continue;
		const text = line.trim().replace(/^#+\s*/, "");
		if (text.length === 0) continue;
		return text.length > EXCERPT_LENGTH ? `${text.slice(0, EXCERPT_LENGTH - 1)}…` : text;
	}
	return undefined;
}

/**
 * Plain substring search, every term required, ranked by where the matches
 * land: title beats project and branch, which beat the body. No index — the
 * store is hundreds of small files, and scanning them is cheaper than keeping
 * an index honest.
 */
export function searchPlans(plans: StoredPlan[], query: string): SearchHit[] {
	const needles = terms(query);
	if (needles.length === 0) return [];

	const hits: SearchHit[] = [];
	for (const plan of plans) {
		const title = plan.meta.title.toLowerCase();
		const scope = `${plan.meta.project} ${plan.meta.branch} ${plan.meta.id}`.toLowerCase();
		const body = plan.body.toLowerCase();

		let score = 0;
		let matchedAll = true;
		for (const needle of needles) {
			if (title.includes(needle)) score += 4;
			else if (scope.includes(needle)) score += 2;
			else if (body.includes(needle)) score += 1;
			else {
				matchedAll = false;
				break;
			}
		}
		if (!matchedAll) continue;

		const excerpt = excerptFor(plan.body, needles);
		hits.push({ plan, score, ...(excerpt === undefined ? {} : { excerpt }) });
	}

	return hits.sort(
		(a, b) => b.score - a.score || b.plan.meta.updated.localeCompare(a.plan.meta.updated),
	);
}
