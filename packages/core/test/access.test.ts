import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { canRead, shareUrls } from "../src/access";
import { CODE_LENGTH, codesMatch, isCode, newCode, normalizeCode } from "../src/code";
import type { PlanMeta } from "../src/meta";
import { parsePlan, serializePlan } from "../src/meta";
import { addPlan, getPlan, updatePlan } from "../src/store";

const base: PlanMeta = {
	id: "a3f9c2",
	title: "Worktree GC",
	project: "nest",
	branch: "main",
	format: "md",
	created: "2026-07-26T00:00:00.000Z",
	updated: "2026-07-26T00:00:00.000Z",
	visibility: "private",
	code: "KRWT",
};

/** `exactOptionalPropertyTypes` wants the key gone, not set to undefined. */
function withoutCode(meta: PlanMeta): PlanMeta {
	const { code: _dropped, ...rest } = meta;
	return rest;
}

const publicMeta: PlanMeta = { ...withoutCode(base), visibility: "public" };

describe("share codes", () => {
	test("are four letters with no lookalikes", () => {
		for (let i = 0; i < 500; i++) {
			const code = newCode();
			expect(code).toHaveLength(CODE_LENGTH);
			expect(isCode(code)).toBe(true);
			expect(code).not.toMatch(/[IOQL]/);
		}
	});

	test("input is uppercased and whitespace-trimmed", () => {
		expect(normalizeCode(" krwt ")).toBe("KRWT");
		expect(normalizeCode("KrWt")).toBe("KRWT");
	});

	test("anything that isn't a code is rejected outright", () => {
		for (const bad of ["", "KRW", "KRWTX", "KR-T", "KROT", "1234", null, undefined]) {
			expect(normalizeCode(bad)).toBeUndefined();
		}
	});

	test("matching is case-insensitive and never matches a missing code", () => {
		expect(codesMatch("KRWT", "krwt")).toBe(true);
		expect(codesMatch("KRWT", "KRWA")).toBe(false);
		expect(codesMatch(undefined, "KRWT")).toBe(false);
		expect(codesMatch("KRWT", undefined)).toBe(false);
		expect(codesMatch(undefined, undefined)).toBe(false);
	});
});

describe("canRead", () => {
	test("public plans are readable by anyone, code or not", () => {
		expect(canRead(publicMeta)).toBe(true);
		expect(canRead(publicMeta, { code: "XXXX" })).toBe(true);
	});

	test("private plans need the code", () => {
		expect(canRead(base)).toBe(false);
		expect(canRead(base, { code: "KRWT" })).toBe(true);
		expect(canRead(base, { code: "krwt" })).toBe(true);
		expect(canRead(base, { code: "WRON" })).toBe(false);
	});

	test("the owner never needs a code", () => {
		expect(canRead(base, { isOwner: true })).toBe(true);
	});

	test("a private plan with no code is owner-only", () => {
		const meta = withoutCode(base);
		expect(canRead(meta)).toBe(false);
		expect(canRead(meta, { code: "KRWT" })).toBe(false);
		expect(canRead(meta, { isOwner: true })).toBe(true);
	});
});

describe("shareUrls", () => {
	test("private plans get both forms", () => {
		expect(shareUrls("https://plans.host-plan.com", base)).toEqual({
			url: "https://plans.host-plan.com/p/a3f9c2",
			codedUrl: "https://plans.host-plan.com/p/a3f9c2?code=KRWT",
		});
	});

	test("public plans get one bare link", () => {
		expect(shareUrls("https://plans.host-plan.com/", publicMeta)).toEqual({
			url: "https://plans.host-plan.com/p/a3f9c2",
		});
	});
});

describe("visibility in frontmatter", () => {
	test("round-trips with the code", () => {
		const parsed = parsePlan(serializePlan(base, "body\n"), "md");
		expect(parsed.meta.visibility).toBe("private");
		expect(parsed.meta.code).toBe("KRWT");
	});

	test("plans predating visibility are treated as private", () => {
		const legacy = "---\nhostplan_id: a3f9c2\ntitle: Old\n---\nbody\n";
		const parsed = parsePlan(legacy, "md");
		expect(parsed.meta.visibility).toBe("private");
		expect(parsed.meta.code).toBeUndefined();
		expect(canRead(parsed.meta)).toBe(false);
	});

	test("a corrupt code is dropped rather than trusted", () => {
		const raw = "---\nhostplan_id: a3f9c2\nvisibility: private\ncode: nonsense\n---\nbody\n";
		expect(parsePlan(raw, "md").meta.code).toBeUndefined();
	});
});

describe("store visibility", () => {
	let home: string;

	beforeEach(async () => {
		home = await mkdtemp(join(tmpdir(), "hostplan-access-"));
		process.env.HOSTPLAN_HOME = home;
	});

	afterEach(async () => {
		delete process.env.HOSTPLAN_HOME;
		await rm(home, { recursive: true, force: true });
	});

	const input = {
		content: "# Plan\n\nbody\n",
		title: "Plan",
		project: "nest",
		branch: "main",
		format: "md" as const,
	};

	test("defaults to private with a generated code", async () => {
		const plan = await addPlan(input);
		expect(plan.meta.visibility).toBe("private");
		expect(isCode(plan.meta.code ?? "")).toBe(true);
	});

	test("public plans are stored without a code", async () => {
		const plan = await addPlan({ ...input, visibility: "public" });
		expect(plan.meta.visibility).toBe("public");
		expect(plan.meta.code).toBeUndefined();
		expect((await getPlan(plan.meta.id))?.meta.code).toBeUndefined();
	});

	test("publishing drops the code, unpublishing issues a fresh one", async () => {
		const plan = await addPlan(input);
		const original = plan.meta.code;

		const published = await updatePlan(plan.meta.id, { visibility: "public" });
		expect(published?.meta.code).toBeUndefined();
		expect((await getPlan(plan.meta.id))?.meta.code).toBeUndefined();

		const reprivate = await updatePlan(plan.meta.id, { visibility: "private" });
		expect(isCode(reprivate?.meta.code ?? "")).toBe(true);
		// A code that was already shared must not come back by itself.
		expect(reprivate?.meta.code).not.toBe(original);
	});

	test("rotating invalidates the old code and keeps the body intact", async () => {
		const plan = await addPlan(input);
		const rotated = await updatePlan(plan.meta.id, { rotateCode: true });
		expect(rotated?.meta.code).not.toBe(plan.meta.code);
		expect(canRead(rotated?.meta ?? plan.meta, { code: plan.meta.code })).toBe(false);
		expect((await getPlan(plan.meta.id))?.body.trim()).toBe("# Plan\n\nbody".trim());
	});

	test("updating a missing plan reports it rather than throwing", async () => {
		expect(await updatePlan("zzzzzz", { visibility: "public" })).toBeUndefined();
	});
});
