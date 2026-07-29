import { describe, expect, test } from "bun:test";
import { searchPlans } from "../src/search";
import { byId, isBlocked, nextActionable, stackOf } from "../src/stack";
import type { PlanStatus } from "../src/status";
import type { StoredPlan } from "../src/store";
import { parseTasks, setTask } from "../src/tasks";

function plan(
	id: string,
	overrides: { status?: PlanStatus; dependsOn?: string; title?: string; body?: string } = {},
): StoredPlan {
	return {
		meta: {
			id,
			title: overrides.title ?? `Plan ${id}`,
			project: "proj",
			branch: "main",
			format: "md",
			// Created order follows the id so sorts are deterministic in tests.
			created: `2026-01-${String(id.charCodeAt(0) - 96).padStart(2, "0")}T00:00:00.000Z`,
			updated: "2026-01-09T00:00:00.000Z",
			visibility: "private",
			status: overrides.status ?? "draft",
			theme: "hostplan",
			...(overrides.dependsOn === undefined ? {} : { dependsOn: overrides.dependsOn }),
		},
		body: overrides.body ?? "",
		path: `/tmp/${id}.md`,
		projectDir: "proj",
		branchDir: "main",
	};
}

describe("stacks", () => {
	const a = plan("a", { status: "done" });
	const b = plan("b", { dependsOn: "a" });
	const c = plan("c", { dependsOn: "b" });
	const loose = plan("d");
	const all = [c, loose, a, b];

	test("stackOf returns the chain root-first from any member", () => {
		expect(stackOf(b, all).map((p) => p.meta.id)).toEqual(["a", "b", "c"]);
		expect(stackOf(c, all).map((p) => p.meta.id)).toEqual(["a", "b", "c"]);
	});

	test("blocked follows the dependency's status", () => {
		const map = byId(all);
		expect(isBlocked(b, map)).toBe(false); // a is done
		expect(isBlocked(c, map)).toBe(true); // b is not
		expect(isBlocked(loose, map)).toBe(false);
	});

	test("a dangling dependency does not block forever", () => {
		const orphan = plan("e", { dependsOn: "gone12" });
		expect(isBlocked(orphan, byId([orphan]))).toBe(false);
	});

	test("nextActionable skips settled and blocked plans", () => {
		expect(nextActionable(all)?.meta.id).toBe("b");
		const bDone = plan("b", { dependsOn: "a", status: "done" });
		expect(nextActionable([a, bDone, c, loose])?.meta.id).toBe("c");
	});

	test("a hand-crafted cycle terminates instead of hanging", () => {
		const x = plan("x", { dependsOn: "y" });
		const y = plan("y", { dependsOn: "x" });
		expect(stackOf(x, [x, y]).length).toBe(2);
	});
});

describe("search", () => {
	const plans = [
		plan("a", { title: "Rate limiting for the API", body: "Use a token bucket.\n" }),
		plan("b", { title: "Worktree GC", body: "Rate of cleanup is hourly.\n" }),
		plan("c", { title: "Unrelated", body: "Nothing here.\n" }),
	];

	test("every term must match, title outranks body", () => {
		const hits = searchPlans(plans, "rate");
		expect(hits.map((h) => h.plan.meta.id)).toEqual(["a", "b"]);
		// The title matched, not the body, so there is no body excerpt to show.
		expect(hits[0]?.excerpt).toBeUndefined();
		expect(searchPlans(plans, "bucket")[0]?.excerpt).toBe("Use a token bucket.");
	});

	test("terms are ANDed across fields", () => {
		expect(searchPlans(plans, "rate bucket").map((h) => h.plan.meta.id)).toEqual(["a"]);
		expect(searchPlans(plans, "rate zebra")).toEqual([]);
	});
});

describe("tasks", () => {
	const body = "# Plan\n\n- [ ] first\n- [x] second\nprose\n1. [ ] third\n";

	test("parses checkboxes with 1-based indexes", () => {
		const tasks = parseTasks(body);
		expect(tasks.map((t) => [t.index, t.text, t.done])).toEqual([
			[1, "first", false],
			[2, "second", true],
			[3, "third", false],
		]);
	});

	test("setTask rewrites only the matching line", () => {
		const checked = setTask(body, 1, true);
		expect(checked).toContain("- [x] first");
		expect(checked).toContain("- [x] second");
		expect(setTask(body, 9, true)).toBeUndefined();
	});
});
