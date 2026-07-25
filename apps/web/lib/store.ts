import { fsPlanStore, type PlanStore } from "@hostplan/core";
import { supabasePlanStore } from "./supabase-store";

/**
 * Deployed with Supabase configured, the store is the bucket; run locally it's
 * the folder under `~/.hostplan` the CLI already writes to. Everything above
 * this line is identical either way.
 */
export function planStore(): PlanStore {
	return process.env.SUPABASE_URL === undefined ? fsPlanStore : supabasePlanStore;
}

export function isRemoteStore(): boolean {
	return process.env.SUPABASE_URL !== undefined;
}
