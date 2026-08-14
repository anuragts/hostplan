import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
	type AddPlanInput,
	CUSTOM_HTML_SKELETON,
	type PlanFormat,
	type StoredPlan,
	type UpdatePlanPatch,
} from "@hostplan/core";
import type { Viewer } from "../lib/viewer";

let added: AddPlanInput | undefined;
let patched: UpdatePlanPatch | undefined;
let currentFormat: PlanFormat = "md";
let viewer: Viewer = { kind: "local" };

function stored(format: PlanFormat = currentFormat): StoredPlan {
	return {
		meta: {
			id: "a3f9c2",
			title: "Plan",
			project: "hostplan",
			branch: "main",
			format,
			created: "2026-07-30T00:00:00.000Z",
			updated: "2026-07-30T00:00:00.000Z",
			visibility: "private",
			status: "draft",
			theme: "hostplan",
			code: "KRWT",
		},
		body: "# Plan\n",
		path: "/tmp/a3f9c2.md",
		projectDir: "hostplan",
		branchDir: "main",
	};
}

const store = {
	add: async (input: AddPlanInput) => {
		added = input;
		return stored(input.format);
	},
	update: async (_id: string, patch: UpdatePlanPatch) => {
		patched = patch;
		return stored();
	},
	get: async () => stored(),
	list: async () => [],
	remove: async () => undefined,
};

mock.module("@/lib/current-viewer", () => ({
	currentViewer: async () => viewer,
	unauthorized: () => Response.json({ error: "unauthorized" }, { status: 401 }),
}));

mock.module("@/lib/store", () => ({
	planStoreFor: () => store,
	adminPlanStore: () => store,
	planStore: () => store,
	isRemoteStore: () => false,
}));

mock.module("@/lib/server-analytics", () => ({
	captureServerEvent: () => undefined,
}));

const { POST } = await import("../app/api/plans/route");
const { PATCH } = await import("../app/api/plans/[id]/route");
const context = { params: Promise.resolve({ id: "a3f9c2" }) };

beforeEach(() => {
	added = undefined;
	patched = undefined;
	currentFormat = "md";
	viewer = { kind: "local" };
});

describe("plan content API mutations", () => {
	test("accepts valid custom HTML and rejects invalid HTML before storage", async () => {
		const valid = await POST(
			new Request("https://plans.host-plan.com/api/plans", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					content: CUSTOM_HTML_SKELETON,
					title: "Custom plan",
					project: "hostplan",
					branch: "main",
					format: "html",
				}),
			}),
		);
		expect(valid.status).toBe(201);
		expect(added?.format).toBe("html");

		added = undefined;
		const invalid = await POST(
			new Request("https://plans.host-plan.com/api/plans", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					content: "<script>alert(1)</script>",
					title: "Unsafe",
					project: "hostplan",
					branch: "main",
					format: "html",
				}),
			}),
		);
		expect(invalid.status).toBe(422);
		expect(added).toBeUndefined();
	});

	test("allows trusted HTML only for an authorized publisher", async () => {
		viewer = {
			kind: "user",
			userId: "user-a",
			email: "anuragsharma011011@gmail.com",
			db: {} as never,
		};
		const trusted = await POST(
			new Request("https://plans.host-plan.com/api/plans", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					content: "<!doctype html><script>window.ready = true</script>",
					title: "Trusted site",
					project: "hostplan",
					branch: "main",
					format: "html",
					trustedHtml: true,
				}),
			}),
		);
		expect(trusted.status).toBe(201);
		expect(added?.content).toContain("hostplan-trusted-html-v1");
		expect(added?.content).toContain("<script>");

		added = undefined;
		viewer = {
			kind: "user",
			userId: "user-b",
			email: "other@example.com",
			db: {} as never,
		};
		const rejected = await POST(
			new Request("https://plans.host-plan.com/api/plans", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					content: "<!doctype html><script>window.ready = true</script>",
					title: "Rejected site",
					project: "hostplan",
					branch: "main",
					format: "html",
					trustedHtml: true,
				}),
			}),
		);
		expect(rejected.status).toBe(403);
		expect(added).toBeUndefined();
	});

	test("validates HTML content updates but not metadata-only updates", async () => {
		currentFormat = "html";
		const invalid = await PATCH(
			new Request("https://plans.host-plan.com/api/plans/a3f9c2", {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ content: "<script>alert(1)</script>" }),
			}),
			context,
		);
		expect(invalid.status).toBe(422);
		expect(patched).toBeUndefined();

		const metadata = await PATCH(
			new Request("https://plans.host-plan.com/api/plans/a3f9c2", {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ status: "approved" }),
			}),
			context,
		);
		expect(metadata.status).toBe(200);
		expect(patched?.status).toBe("approved");
	});

	test("ignores retired theme input instead of mutating presentation", async () => {
		const create = await POST(
			new Request("https://plans.host-plan.com/api/plans", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					content: "# Plan",
					title: "Plan",
					project: "hostplan",
					branch: "main",
					theme: "editorial",
				}),
			}),
		);
		const update = await PATCH(
			new Request("https://plans.host-plan.com/api/plans/a3f9c2", {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ theme: "editorial" }),
			}),
			context,
		);

		expect(create.status).toBe(201);
		expect(update.status).toBe(200);
		expect(added).not.toHaveProperty("theme");
		expect(patched).not.toHaveProperty("theme");
	});
});
