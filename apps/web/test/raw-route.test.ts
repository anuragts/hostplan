import { beforeEach, describe, expect, mock, test } from "bun:test";
import { CUSTOM_HTML_SKELETON, type StoredPlan } from "@hostplan/core";
import type { Viewer } from "../lib/viewer";

const plan: StoredPlan = {
	meta: {
		id: "a3f9c2",
		title: "Worktree GC",
		project: "nest",
		branch: "main",
		format: "md",
		created: "2026-07-26T00:00:00.000Z",
		updated: "2026-07-26T00:00:00.000Z",
		visibility: "private",
		status: "draft",
		theme: "hostplan",
		code: "KRWT",
	},
	body: "# Worktree GC\n",
	path: "/plans/a3f9c2.md",
	projectDir: "nest",
	branchDir: "main",
	ownerId: "user-a",
};

let storedPlan: StoredPlan | undefined = plan;
let viewer: Viewer = { kind: "anonymous" };

mock.module("@/lib/store", () => ({
	adminPlanStore: () => ({
		get: async () => storedPlan,
	}),
}));

mock.module("@/lib/current-viewer", () => ({
	currentViewer: async () => viewer,
}));

const { GET } = await import("../app/api/raw/[id]/route");
const { GET: renderGET } = await import("../app/api/render/[id]/route");
const context = { params: Promise.resolve({ id: "a3f9c2" }) };

function request(query = "", ip = "203.0.113.1"): Request {
	return new Request(`https://plans.host-plan.com/api/raw/a3f9c2${query}`, {
		headers: { "x-forwarded-for": ip },
	});
}

function user(userId: string): Viewer {
	return {
		kind: "user",
		userId,
		email: `${userId}@example.com`,
		db: {} as never,
	};
}

beforeEach(() => {
	storedPlan = plan;
	viewer = { kind: "anonymous" };
});

describe("raw plan route", () => {
	test("returns public plans without a code", async () => {
		const { code: _code, ...withoutCode } = plan.meta;
		storedPlan = {
			...plan,
			meta: { ...withoutCode, visibility: "public" },
		};

		const response = await GET(request(), context);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
		expect(response.headers.get("vary")).toContain("Accept");
		expect(await response.text()).toBe(plan.body);
	});

	test("returns a private plan for the correct code or its owner", async () => {
		const coded = await GET(request("?code=krwt"), context);
		viewer = user("user-a");
		const owned = await GET(request("", "203.0.113.2"), context);

		expect(coded.status).toBe(200);
		expect(owned.status).toBe(200);
	});

	test("does not treat another signed-in account as the owner", async () => {
		viewer = user("user-b");

		expect((await GET(request(), context)).status).toBe(404);
	});

	test("returns not found for wrong codes and unknown plans", async () => {
		expect((await GET(request("?code=WRON"), context)).status).toBe(404);
		storedPlan = undefined;
		expect((await GET(request(), context)).status).toBe(404);
	});

	test("does not count a missing code as a failed attempt", async () => {
		for (let attempt = 0; attempt < 12; attempt++) {
			expect((await GET(request("", "203.0.113.10"), context)).status).toBe(404);
		}

		expect((await GET(request("?code=WRON", "203.0.113.10"), context)).status).toBe(404);
	});

	test("rate-limits repeated supplied wrong codes", async () => {
		for (let attempt = 0; attempt < 10; attempt++) {
			expect((await GET(request("?code=WRON", "203.0.113.11"), context)).status).toBe(404);
		}

		expect((await GET(request("?code=WRON", "203.0.113.11"), context)).status).toBe(429);
	});
});

describe("custom HTML render route", () => {
	test("injects components behind the same access gate and sandbox", async () => {
		storedPlan = {
			...plan,
			meta: { ...plan.meta, format: "html" },
			body: CUSTOM_HTML_SKELETON,
			path: "/plans/a3f9c2.html",
		};
		const response = await renderGET(request("?code=krwt"), context);
		const body = await response.text();

		expect(response.status).toBe(200);
		expect(body).toContain('data-hostplan-components="custom-html-v1"');
		expect(body).toContain(".hp-card");
		expect(storedPlan.body).not.toContain("data-hostplan-components");
		expect(response.headers.get("content-security-policy")).toContain("script-src 'none'");
		expect(response.headers.get("referrer-policy")).toBe("no-referrer");
	});

	test("rejects unauthorized readers and Markdown plans", async () => {
		storedPlan = { ...plan, meta: { ...plan.meta, format: "html" }, body: CUSTOM_HTML_SKELETON };
		expect((await renderGET(request(), context)).status).toBe(404);
		storedPlan = plan;
		expect((await renderGET(request("?code=krwt"), context)).status).toBe(404);
	});
});
