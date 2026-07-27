import type { StoredPlan } from "@hostplan/core";
import type { Viewer } from "./viewer";

/**
 * Ownership belongs to the plan, not to any authenticated account. Locally
 * there is only one user and one filesystem store, so the local viewer owns it.
 */
export function ownsPlan(plan: Pick<StoredPlan, "ownerId">, viewer: Viewer): boolean {
	if (viewer.kind === "local") return true;
	return viewer.kind === "user" && plan.ownerId !== undefined && plan.ownerId === viewer.userId;
}
