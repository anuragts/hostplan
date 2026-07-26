import { expect, test } from "bun:test";
import { canRead } from "../src/access";
import { isCode } from "../src/code";
import type { PlanStore } from "../src/plan-store";

/**
 * One suite both implementations must satisfy.
 *
 * The filesystem store runs it on every `bun test`. The Supabase store runs the
 * exact same assertions against a real bucket once credentials exist, so the
 * two can't quietly drift — the failure mode this guards against is a remote
 * store that stores plans but, say, forgets to generate a code, or rotates the
 * wrong way, and only misbehaves in production.
 */
export function runPlanStoreContract(store: PlanStore): void {
	const input = {
		content: "# Contract\n\nbody line\n",
		title: "Contract Plan",
		project: "contract-proj",
		branch: "feat/contract",
		format: "md" as const,
	};

	test("add returns a plan that get can find again", async () => {
		const added = await store.add(input);
		expect(added.meta.id).toHaveLength(6);

		const fetched = await store.get(added.meta.id);
		expect(fetched?.meta.title).toBe("Contract Plan");
		expect(fetched?.body.trim()).toBe(input.content.trim());
		// The raw branch survives even though the key is slugified.
		expect(fetched?.meta.branch).toBe("feat/contract");
		expect(fetched?.branchDir).toBe("feat-contract");

		await store.remove(added.meta.id);
	});

	test("defaults to private with a usable code", async () => {
		const added = await store.add(input);
		expect(added.meta.visibility).toBe("private");
		expect(isCode(added.meta.code ?? "")).toBe(true);
		expect(canRead(added.meta, { code: added.meta.code })).toBe(true);
		expect(canRead(added.meta)).toBe(false);
		await store.remove(added.meta.id);
	});

	test("public plans carry no code and are readable by anyone", async () => {
		const added = await store.add({ ...input, visibility: "public" });
		const fetched = await store.get(added.meta.id);
		expect(fetched?.meta.visibility).toBe("public");
		expect(fetched?.meta.code).toBeUndefined();
		expect(canRead(fetched?.meta ?? added.meta)).toBe(true);
		await store.remove(added.meta.id);
	});

	test("publish then unpublish issues a different code", async () => {
		const added = await store.add(input);
		const first = added.meta.code;

		await store.update(added.meta.id, { visibility: "public" });
		expect((await store.get(added.meta.id))?.meta.code).toBeUndefined();

		const reprivate = await store.update(added.meta.id, { visibility: "private" });
		expect(isCode(reprivate?.meta.code ?? "")).toBe(true);
		expect(reprivate?.meta.code).not.toBe(first);

		await store.remove(added.meta.id);
	});

	test("rotate invalidates the old code and leaves the body untouched", async () => {
		const added = await store.add(input);
		const rotated = await store.update(added.meta.id, { rotateCode: true });

		expect(rotated?.meta.code).not.toBe(added.meta.code);
		expect(canRead(rotated?.meta ?? added.meta, { code: added.meta.code })).toBe(false);

		const fetched = await store.get(added.meta.id);
		expect(fetched?.body.trim()).toBe(input.content.trim());
		expect(fetched?.meta.code).toBe(rotated?.meta.code);

		await store.remove(added.meta.id);
	});

	test("list filters by project and branch", async () => {
		const mine = await store.add(input);
		const other = await store.add({ ...input, project: "contract-other", branch: "main" });

		const byProject = await store.list({ project: "contract-proj" });
		expect(byProject.some((p) => p.meta.id === mine.meta.id)).toBe(true);
		expect(byProject.some((p) => p.meta.id === other.meta.id)).toBe(false);

		const byBranch = await store.list({ project: "contract-proj", branch: "feat/contract" });
		expect(byBranch.some((p) => p.meta.id === mine.meta.id)).toBe(true);

		await store.remove(mine.meta.id);
		await store.remove(other.meta.id);
	});

	test("ids are unique across concurrent adds", async () => {
		const added = await Promise.all(
			Array.from({ length: 5 }, (_, i) => store.add({ ...input, title: `Concurrent ${i}` })),
		);
		expect(new Set(added.map((p) => p.meta.id)).size).toBe(5);
		await Promise.all(added.map((p) => store.remove(p.meta.id)));
	});

	test("plans start as drafts and status changes stick", async () => {
		const added = await store.add(input);
		expect(added.meta.status).toBe("draft");

		await store.update(added.meta.id, { status: "approved" });
		const fetched = await store.get(added.meta.id);
		expect(fetched?.meta.status).toBe("approved");
		// Changing status must not disturb anything else.
		expect(fetched?.body.trim()).toBe(input.content.trim());
		expect(fetched?.meta.code).toBe(added.meta.code);

		await store.remove(added.meta.id);
	});

	test("a dependency link survives the round trip", async () => {
		const first = await store.add(input);
		const second = await store.add({ ...input, title: "Step Two", dependsOn: first.meta.id });

		expect((await store.get(second.meta.id))?.meta.dependsOn).toBe(first.meta.id);

		await store.update(second.meta.id, { dependsOn: null });
		expect((await store.get(second.meta.id))?.meta.dependsOn).toBeUndefined();

		await store.remove(first.meta.id);
		await store.remove(second.meta.id);
	});

	test("updating content revises the plan under the same id", async () => {
		const added = await store.add(input);
		const revised = await store.update(added.meta.id, { content: "# Contract\n\nrevised\n" });
		expect(revised?.meta.id).toBe(added.meta.id);

		const fetched = await store.get(added.meta.id);
		expect(fetched?.body).toContain("revised");
		expect(fetched?.body).not.toContain("body line");

		await store.remove(added.meta.id);
	});

	test("missing plans are reported, not thrown", async () => {
		expect(await store.get("zzzzzz")).toBeUndefined();
		expect(await store.update("zzzzzz", { visibility: "public" })).toBeUndefined();
		expect(await store.remove("zzzzzz")).toBeUndefined();
	});
}
