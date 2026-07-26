/**
 * Where a plan is in its life. The order here is the order of the workflow:
 * an agent writes a `draft`, a human marks it `approved`, implementation moves
 * it through `in-progress` to `done`. `superseded` is for plans replaced by a
 * newer one rather than carried out.
 */
export const PLAN_STATUSES = ["draft", "approved", "in-progress", "done", "superseded"] as const;

export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const DEFAULT_STATUS: PlanStatus = "draft";

export function isStatus(value: unknown): value is PlanStatus {
	return typeof value === "string" && (PLAN_STATUSES as readonly string[]).includes(value);
}

/**
 * Settled plans are over — carried out or replaced. Listings push them out of
 * the way; a dependent plan unblocks only when its dependency is `done`, since
 * a superseded step was never actually finished.
 */
export function isSettled(status: PlanStatus): boolean {
	return status === "done" || status === "superseded";
}
