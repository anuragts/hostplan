import { listPlans, planUrl, resolvePort } from "@hostplan/core";
import { note, printJson, relativeTime, style, table } from "../output";
import { describeFilter, resolveFilter, type ScopeOptions } from "./shared";

export interface ListOptions extends ScopeOptions {
	json?: boolean;
	limit?: string;
}

export async function listCommand(options: ListOptions): Promise<void> {
	const filter = await resolveFilter(options);
	const limit = options.limit === undefined ? undefined : Number.parseInt(options.limit, 10);

	const all = await listPlans(filter);
	const plans = limit !== undefined && limit > 0 ? all.slice(0, limit) : all;
	const port = await resolvePort();

	if (options.json === true) {
		printJson({
			filter,
			total: all.length,
			plans: plans.map((plan) => ({
				...plan.meta,
				url: planUrl(port, plan.meta.id),
				path: plan.path,
			})),
		});
		return;
	}

	if (plans.length === 0) {
		note(style.dim(`no plans in ${describeFilter(filter)} — try \`hsp list --all\``));
		return;
	}

	const rows = plans.map((plan) => [
		style.cyan(plan.meta.id),
		plan.meta.title,
		style.dim(`${plan.meta.project} / ${plan.meta.branch}`),
		style.dim(relativeTime(plan.meta.updated)),
	]);
	process.stdout.write(`${table(rows)}\n`);

	if (plans.length < all.length) {
		note(style.dim(`showing ${plans.length} of ${all.length}`));
	}
}
