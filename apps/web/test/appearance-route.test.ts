import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { PlanMeta } from "@hostplan/core";

const meta: PlanMeta = {
	id: "a3f9c2",
	title: "Private architecture plan",
	project: "secret-project",
	branch: "main",
	format: "md",
	created: "2026-07-30T00:00:00.000Z",
	updated: "2026-07-30T00:00:00.000Z",
	visibility: "private",
	status: "draft",
	theme: "technical-brief",
	code: "KRWT",
	source: "/Users/anurag/secret/PLAN.md",
	cwd: "/Users/anurag/secret",
};

let storedMeta: PlanMeta | undefined = meta;

mock.module("@/lib/store", () => ({
	adminPlanStore: () => ({
		getMeta: async () => storedMeta,
	}),
}));

const { GET } = await import("../app/api/plans/[id]/appearance/route");

beforeEach(() => {
	storedMeta = meta;
});

describe("public plan appearance route", () => {
	test("returns only allowlisted appearance without a share code", async () => {
		const response = await GET(new Request("https://plans.host-plan.com"), {
			params: Promise.resolve({ id: meta.id }),
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("cache-control")).toContain("public");
		expect(await response.json()).toEqual({ theme: "technical-brief", version: 1 });
	});

	test("does not reveal whether malformed or missing ids have metadata", async () => {
		const malformed = await GET(new Request("https://plans.host-plan.com"), {
			params: Promise.resolve({ id: "bad" }),
		});
		storedMeta = undefined;
		const missing = await GET(new Request("https://plans.host-plan.com"), {
			params: Promise.resolve({ id: "zzzzzz" }),
		});

		expect(malformed.status).toBe(404);
		expect(missing.status).toBe(404);
	});
});
