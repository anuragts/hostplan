import { isSettled } from "./status";
import type { StoredPlan } from "./store";

/**
 * A stack is a chain of plans linked by `dependsOn`: step 2 waits on step 1,
 * step 3 on step 2. Nothing here is stored — the links are, and the chain is
 * recomputed from whatever set of plans the caller has in hand.
 */

export function byId(plans: StoredPlan[]): Map<string, StoredPlan> {
	return new Map(plans.map((plan) => [plan.meta.id, plan]));
}

/**
 * Blocked means: waiting on a dependency that exists and is not done yet. A
 * dangling dependency (deleted, or not in this store) does not block — a plan
 * that can never unblock is worse than one that unblocks early.
 */
export function isBlocked(plan: StoredPlan, plans: Map<string, StoredPlan>): boolean {
	if (plan.meta.dependsOn === undefined) return false;
	const dependency = plans.get(plan.meta.dependsOn);
	return dependency !== undefined && dependency.meta.status !== "done";
}

function rootOf(plan: StoredPlan, plans: Map<string, StoredPlan>): StoredPlan {
	let current = plan;
	const seen = new Set([current.meta.id]);
	while (current.meta.dependsOn !== undefined) {
		const parent = plans.get(current.meta.dependsOn);
		// A cycle can only be hand-crafted, but walking one forever would hang
		// every listing; the first repeat wins the title of root.
		if (parent === undefined || seen.has(parent.meta.id)) return current;
		seen.add(parent.meta.id);
		current = parent;
	}
	return current;
}

function oldestFirst(a: StoredPlan, b: StoredPlan): number {
	return a.meta.created.localeCompare(b.meta.created);
}

/**
 * The full chain a plan belongs to, root first. Follows `dependsOn` links both
 * ways; if a step has several dependents the walk stays depth-first in
 * creation order, so a forked stack still reads top to bottom.
 */
export function stackOf(plan: StoredPlan, all: StoredPlan[]): StoredPlan[] {
	const plans = byId(all);
	const dependents = new Map<string, StoredPlan[]>();
	for (const candidate of all) {
		const dep = candidate.meta.dependsOn;
		if (dep === undefined) continue;
		const bucket = dependents.get(dep);
		if (bucket === undefined) dependents.set(dep, [candidate]);
		else bucket.push(candidate);
	}

	const chain: StoredPlan[] = [];
	const seen = new Set<string>();
	const walk = (current: StoredPlan): void => {
		if (seen.has(current.meta.id)) return;
		seen.add(current.meta.id);
		chain.push(current);
		for (const next of (dependents.get(current.meta.id) ?? []).sort(oldestFirst)) walk(next);
	};
	walk(rootOf(plan, plans));
	return chain;
}

/** True when the plan is linked to at least one other plan in the set. */
export function inStack(plan: StoredPlan, all: StoredPlan[]): boolean {
	if (plan.meta.dependsOn !== undefined) return true;
	return all.some((candidate) => candidate.meta.dependsOn === plan.meta.id);
}

/**
 * The plan to pick up next: not settled, not blocked, oldest first — so a
 * stack is worked in the order it was laid down. This is what `hsp next`
 * prints and what an agent should implement.
 */
export function nextActionable(all: StoredPlan[]): StoredPlan | undefined {
	const plans = byId(all);
	return all
		.filter((plan) => !isSettled(plan.meta.status) && !isBlocked(plan, plans))
		.sort(oldestFirst)[0];
}
