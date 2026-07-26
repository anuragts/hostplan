import { stat } from "node:fs/promises";
import {
	byId,
	detectScope,
	inStack,
	isBlocked,
	isId,
	listPlans,
	type StoredPlan,
	stackOf,
} from "@hostplan/core";
import { die, note, printJson, style } from "../output";
import type { AddOptions } from "./add";
import { storeOnePlan } from "./add";
import { resolveFilter, resolveRef, type ScopeOptions, statusLabel } from "./shared";

export interface StackOptions extends ScopeOptions, Partial<Omit<AddOptions, keyof ScopeOptions>> {
	json?: boolean;
	/** Chain the first new plan after an existing one instead of starting fresh. */
	after?: string;
	serve: boolean;
}

async function isFile(path: string): Promise<boolean> {
	try {
		return (await stat(path)).isFile();
	} catch {
		return false;
	}
}

function chainLines(chain: StoredPlan[], all: StoredPlan[]): string[] {
	const map = byId(all);
	return chain.map((plan, index) => {
		const blocked = isBlocked(plan, map);
		const marker =
			plan.meta.status === "done" ? style.green("✔") : blocked ? style.red("⛔") : style.cyan("→");
		return [
			`  ${index + 1}`,
			marker,
			style.cyan(plan.meta.id),
			plan.meta.title,
			style.dim("·"),
			statusLabel(plan.meta.status),
			...(blocked ? [style.dim(`waits on ${plan.meta.dependsOn}`)] : []),
		].join(" ");
	});
}

function chainJson(chain: StoredPlan[], all: StoredPlan[]) {
	const map = byId(all);
	return chain.map((plan, index) => ({
		position: index + 1,
		...plan.meta,
		blocked: isBlocked(plan, map),
	}));
}

async function showChain(ref: string, options: StackOptions): Promise<void> {
	const plan = await resolveRef(ref, await resolveFilter(options));
	// Chains may cross branches (split a branch plan into per-branch steps), so
	// the walk always sees the whole store.
	const all = await listPlans();
	const chain = stackOf(plan, all);

	if (options.json === true) {
		printJson({ stack: chainJson(chain, all) });
		return;
	}
	if (chain.length === 1) {
		note(style.dim(`${plan.meta.id} is not part of a stack`));
		return;
	}
	process.stdout.write(
		[`${style.bold(`Stack of ${chain.length}`)}`, ...chainLines(chain, all)].join("\n") + "\n",
	);
}

async function listStacks(options: StackOptions): Promise<void> {
	const scoped = await listPlans(await resolveFilter(options));
	const all = await listPlans();
	const seen = new Set<string>();
	const chains: StoredPlan[][] = [];
	for (const plan of scoped) {
		if (!inStack(plan, all)) continue;
		const chain = stackOf(plan, all);
		const rootId = chain[0]?.meta.id ?? plan.meta.id;
		if (seen.has(rootId)) continue;
		seen.add(rootId);
		chains.push(chain);
	}

	if (options.json === true) {
		printJson({ stacks: chains.map((chain) => chainJson(chain, all)) });
		return;
	}
	if (chains.length === 0) {
		note(
			style.dim(
				"no stacks here — chain plans with `hsp stack a.md b.md` or `hsp add --after <id>`",
			),
		);
		return;
	}
	const blocks = chains.map((chain) =>
		[
			`${style.bold(chain[0]?.meta.title ?? "Stack")}  ${style.dim(`· stack of ${chain.length}`)}`,
			...chainLines(chain, all),
		].join("\n"),
	);
	process.stdout.write(`${blocks.join("\n\n")}\n`);
}

/**
 * `hsp stack` — one command, three shapes:
 *
 *   hsp stack                     the stacks in this scope
 *   hsp stack <id|url|latest>     the chain that plan belongs to
 *   hsp stack a.md b.md c.md      store the files as a chain, in order
 *
 * The split-a-big-plan workflow is the third form: an agent writes one file
 * per step and gets back a stack where each step waits on the one before.
 */
export async function stackCommand(items: string[], options: StackOptions): Promise<void> {
	if (items.length === 0) return listStacks(options);

	const first = items[0] as string;
	if (
		items.length === 1 &&
		!(await isFile(first)) &&
		(isId(first.split("/").pop() ?? first) || first === "latest")
	) {
		return showChain(first, options);
	}

	for (const item of items) {
		if (!(await isFile(item))) die(`\`${item}\` is not a plan file (or a plan id to display)`);
	}

	// Each step depends on the one stored before it; --after hooks the whole
	// chain onto an existing plan.
	let previous: string | undefined;
	if (options.after !== undefined) {
		previous = (await resolveRef(options.after, {})).meta.id;
	}

	const scope = await detectScope();
	const stored: StoredPlan[] = [];
	// `after` only positions the chain; storeOnePlan gets the dependency directly.
	const { after: _after, ...addOptions } = options;
	for (const item of items) {
		const result = await storeOnePlan(item, addOptions, scope, previous);
		stored.push(result.plan);
		previous = result.plan.meta.id;
	}

	if (options.json === true) {
		const all = await listPlans();
		printJson({ stack: chainJson(stackOf(stored[0] as StoredPlan, all), all) });
		return;
	}
	const all = await listPlans();
	process.stdout.write(
		[
			`${style.green("✓")} stored a stack of ${stored.length}`,
			...chainLines(stackOf(stored[0] as StoredPlan, all), all),
			style.dim("  `hsp next` prints the step to work on; finishing it unblocks the next"),
		].join("\n") + "\n",
	);
}
