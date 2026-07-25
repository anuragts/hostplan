import { afterAll, beforeAll, describe } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fsPlanStore } from "../src/plan-store";
import { runPlanStoreContract } from "./plan-store-contract";

describe("fsPlanStore", () => {
	let home: string;

	beforeAll(async () => {
		home = await mkdtemp(join(tmpdir(), "hostplan-contract-"));
		process.env.HOSTPLAN_HOME = home;
	});

	afterAll(async () => {
		delete process.env.HOSTPLAN_HOME;
		await rm(home, { recursive: true, force: true });
	});

	runPlanStoreContract(fsPlanStore);
});
