import { describe } from "bun:test";
import { runPlanStoreContract } from "@hostplan/core/test/plan-store-contract";
import { secretKey, supabasePlanStore } from "../lib/supabase-store";

/**
 * Runs the same contract as the filesystem store, against a real bucket.
 *
 * Skipped unless credentials are present, so `bun test` stays offline by
 * default. To validate a deployment's storage before pointing DNS at it:
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... bun test apps/web
 *
 * Point it at a scratch project, not the one holding real plans — the contract
 * creates and deletes plans as it goes.
 */
const configured = process.env.SUPABASE_URL !== undefined && secretKey() !== undefined;

describe.skipIf(!configured)("supabasePlanStore", () => {
	runPlanStoreContract(supabasePlanStore);
});
