import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
	type AddPlanInput,
	CUSTOM_HTML_SKELETON,
	type PlanFormat,
	type StoredPlan,
	type UpdatePlanPatch,
} from "@hostplan/core";

let added: AddPlanInput | undefined;
let patched: UpdatePlanPatch | undefined;
let currentFormat: PlanFormat = "md";

function stored(
	theme: StoredPlan["meta"]["theme"],
	format: PlanFormat = currentFormat,
): StoredPlan {
	return {
		meta: {
			id: "a3f9c2",
			title: "Themed plan",
			project: "hostplan",
			branch: "main",
			format,
			created: "2026-07-30T00:00:00.000Z",
			updated: "2026-07-30T00:00:00.000Z",
			visibility: "private",
			status: "draft",
			theme,
			code: "KRWT",
		},
		body: "# Themed plan\n",
		path: "/tmp/a3f9c2.md",
		projectDir: "hostplan",
		branchDir: "main",
	};
}

const store = {
	add: async (input: AddPlanInput) => {
		added = input;
		return stored(input.theme ?? "hostplan", input.format);
	},
	update: async (_id: string, patch: UpdatePlanPatch) => {
		patched = patch;
		return stored(patch.theme ?? "hostplan");
	},
	get: async () => stored("hostplan"),
	list: async () => [],
	remove: async () => undefined,
};

mock.module("@/lib/current-viewer", () => ({
	currentViewer: async () => ({ kind: "local" as const }),
	unauthorized: () => Response.json({ error: "unauthorized" }, { status: 401 }),
}));

mock.module("@/lib/store", () => ({
	planStoreFor: () => store,
	adminPlanStore: () => store,
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
});

describe("plan theme API mutations", () => {
	test("POST validates and stores a built-in theme", async () => {
		const response = await POST(
			new Request("https://plans.host-plan.com/api/plans", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					content: "# Themed plan",
					title: "Themed plan",
					project: "hostplan",
					branch: "main",
					theme: "editorial",
				}),
			}),
		);

		expect(response.status).toBe(201);
		expect(added?.theme).toBe("editorial");
	});

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

	test("PATCH validates and stores a built-in theme", async () => {
		const response = await PATCH(
			new Request("https://plans.host-plan.com/api/plans/a3f9c2", {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ theme: "technical-brief" }),
			}),
			context,
		);

		expect(response.status).toBe(200);
		expect(patched?.theme).toBe("technical-brief");
	});

	test("rejects arbitrary themes before either store mutation", async () => {
		const create = await POST(
			new Request("https://plans.host-plan.com/api/plans", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					content: "# Themed plan",
					title: "Themed plan",
					project: "hostplan",
					branch: "main",
					theme: "custom-css",
				}),
			}),
		);
		const update = await PATCH(
			new Request("https://plans.host-plan.com/api/plans/a3f9c2", {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ theme: "custom-css" }),
			}),
			context,
		);

		expect(create.status).toBe(400);
		expect(update.status).toBe(400);
		expect(added).toBeUndefined();
		expect(patched).toBeUndefined();
	});
});
