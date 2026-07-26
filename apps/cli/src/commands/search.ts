import { listPlans, planUrl, resolvePort, searchPlans } from "@hostplan/core";
import { note, printJson, relativeTime, style, table } from "../output";
import { resolveFilter, type ScopeOptions, statusLabel } from "./shared";

export interface SearchOptions extends ScopeOptions {
	json?: boolean;
	limit?: string;
}

/**
 * `hsp search` is global by default — its whole point is finding decisions
 * made months ago in other repos. `-p`/`-b` narrow it when asked.
 */
export async function searchCommand(terms: string[], options: SearchOptions): Promise<void> {
	const query = terms.join(" ").trim();
	if (query.length === 0) return note(style.dim("nothing to search for"));

	const scoped = options.project !== undefined || options.branch !== undefined;
	const filter = scoped ? await resolveFilter({ ...options, all: false }) : {};
	const plans = await listPlans(filter);
	const limit = options.limit === undefined ? 20 : Number.parseInt(options.limit, 10);
	const hits = searchPlans(plans, query);
	const shown = limit > 0 ? hits.slice(0, limit) : hits;
	const port = await resolvePort();

	if (options.json === true) {
		printJson({
			query,
			total: hits.length,
			hits: shown.map((hit) => ({
				...hit.plan.meta,
				url: planUrl(port, hit.plan.meta.id),
				path: hit.plan.path,
				...(hit.excerpt === undefined ? {} : { excerpt: hit.excerpt }),
			})),
		});
		return;
	}

	if (hits.length === 0) {
		note(style.dim(`no plans match \`${query}\``));
		return;
	}

	const rows = shown.map((hit) => [
		style.cyan(hit.plan.meta.id),
		hit.plan.meta.title,
		style.dim(`${hit.plan.meta.project} / ${hit.plan.meta.branch}`),
		statusLabel(hit.plan.meta.status),
		style.dim(relativeTime(hit.plan.meta.updated)),
	]);
	process.stdout.write(`${table(rows)}\n`);
	// Excerpts under the table would fight the columns; print the best one.
	const best = shown.find((hit) => hit.excerpt !== undefined);
	if (best?.excerpt !== undefined) {
		note(style.dim(`${best.plan.meta.id}: “${best.excerpt}”`));
	}
	if (shown.length < hits.length) note(style.dim(`showing ${shown.length} of ${hits.length}`));
}
