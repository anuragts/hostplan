import { fsPlanStore, type PlanStore } from "@hostplan/core";
import { pgPlanStore } from "./pg-store";
import { accountsEnabled, adminClient } from "./supabase-clients";
import { supabasePlanStore } from "./supabase-store";
import type { Viewer } from "./viewer";

/**
 * Three backends, picked by how the deployment is configured:
 *
 *   accounts on   -> Postgres index + Storage, scoped to the caller
 *   bucket only   -> the single-owner Supabase store (pre-accounts deployments)
 *   neither       -> the folder under ~/.hostplan the CLI already writes to
 *
 * Everything above this line is identical in all three.
 */
export function planStoreFor(viewer: Viewer): PlanStore {
	if (accountsEnabled()) {
		if (viewer.kind === "user") return pgPlanStore(viewer.db, viewer.userId);
		// Legacy owner and anonymous get an unscoped client; what they may read is
		// still decided by canRead() above, exactly as before accounts existed.
		return pgPlanStore(adminClient());
	}
	return process.env.SUPABASE_URL === undefined ? fsPlanStore : supabasePlanStore;
}

/**
 * For the share-code path, which has to read a plan on behalf of someone with
 * no session at all. The only deliberate RLS bypass in the system.
 */
export function adminPlanStore(): PlanStore {
	if (accountsEnabled()) return pgPlanStore(adminClient());
	return process.env.SUPABASE_URL === undefined ? fsPlanStore : supabasePlanStore;
}

export function isRemoteStore(): boolean {
	return process.env.SUPABASE_URL !== undefined;
}

/** Kept for callers that predate accounts; resolves to the unscoped store. */
export function planStore(): PlanStore {
	return adminPlanStore();
}
