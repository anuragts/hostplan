import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { isId, newId } from "../src/id";
import { type PlanMeta, parsePlan, readSourceFrontmatter, serializePlan } from "../src/meta";
import { deslugify, slugify, titleFromHtml, titleFromMarkdown } from "../src/slug";
import {
	addPlan,
	branchDirName,
	getPlan,
	listPlans,
	projectDirName,
	removePlan,
} from "../src/store";

describe("slugify", () => {
	test("makes branch names filesystem safe", () => {
		expect(slugify("feat/delivery")).toBe("feat-delivery");
		expect(slugify("Release/2024 Q1")).toBe("release-2024-q1");
	});

	test("strips leading and trailing separators", () => {
		expect(slugify("--hello--")).toBe("hello");
		expect(slugify(".hidden")).toBe("hidden");
	});

	test("falls back when nothing survives", () => {
		expect(slugify("🚀", "untitled")).toBe("untitled");
		expect(slugify("", "no-branch")).toBe("no-branch");
	});
});

describe("title extraction", () => {
	test("finds the first markdown heading", () => {
		expect(titleFromMarkdown("intro\n\n# Worktree GC\n\nbody")).toBe("Worktree GC");
		expect(titleFromMarkdown("## Nested Only")).toBe("Nested Only");
		expect(titleFromMarkdown("no heading here")).toBeUndefined();
	});

	test("prefers <title> over <h1>", () => {
		expect(titleFromHtml("<title>Doc</title><h1>Other</h1>")).toBe("Doc");
		expect(titleFromHtml("<h1>Only <em>This</em></h1>")).toBe("Only This");
	});

	test("deslugify is a readable last resort", () => {
		expect(deslugify("worktree-gc")).toBe("Worktree Gc");
	});
});

describe("ids", () => {
	test("are six lowercase alphanumerics", () => {
		for (let i = 0; i < 200; i++) expect(isId(newId())).toBe(true);
	});

	test("reject anything else", () => {
		expect(isId("ABCDEF")).toBe(false);
		expect(isId("abc")).toBe(false);
	});
});

describe("serialization round-trip", () => {
	const meta: PlanMeta = {
		id: "a3f9c2",
		title: "Worktree GC",
		project: "nest",
		branch: "feat/delivery",
		format: "md",
		created: "2026-07-25T18:04:11.220Z",
		updated: "2026-07-25T18:04:11.220Z",
		visibility: "private",
		code: "KRWT",
		source: "/Users/anurag/kafka/nest/PLAN.md",
		cwd: "/Users/anurag/kafka/nest",
	};

	test("markdown keeps metadata and body intact", () => {
		const body = "# Worktree GC\n\nSome *plan* body.\n";
		const parsed = parsePlan(serializePlan(meta, body), "md");
		expect(parsed.meta).toEqual(meta);
		expect(parsed.body.trim()).toBe(body.trim());
	});

	test("markdown preserves extra frontmatter from the source file", () => {
		const raw = serializePlan(meta, "body", { author: "anurag", tags: ["cli"] });
		const reparsed = readSourceFrontmatter(raw);
		expect(reparsed.data.author).toBe("anurag");
	});

	test("html metadata survives a title containing an arrow", () => {
		const htmlMeta: PlanMeta = { ...meta, format: "html", title: "a --> b" };
		const body = "<h1>hi</h1>\n";
		const serialized = serializePlan(htmlMeta, body);
		// The comment must not be terminated early by the title.
		expect(serialized.indexOf("-->")).toBe(serialized.indexOf("-->\n<h1>"));
		const parsed = parsePlan(serialized, "html");
		expect(parsed.meta.title).toBe("a --> b");
		expect(parsed.body).toBe(body);
	});

	test("a plan with no metadata still parses", () => {
		const parsed = parsePlan("# Just a file\n", "md");
		expect(parsed.meta.title).toBe("Untitled Plan");
		expect(parsed.body.trim()).toBe("# Just a file");
	});

	test("malformed source frontmatter does not throw", () => {
		expect(readSourceFrontmatter("---\n: : bad\n---\nbody").data).toEqual({});
	});
});

describe("store", () => {
	let home: string;

	beforeEach(async () => {
		home = await mkdtemp(join(tmpdir(), "hostplan-test-"));
		process.env.HOSTPLAN_HOME = home;
	});

	afterEach(async () => {
		delete process.env.HOSTPLAN_HOME;
		await rm(home, { recursive: true, force: true });
	});

	const base = {
		content: "# Plan\n\nbody\n",
		title: "Plan",
		project: "nest",
		branch: "feat/delivery",
		format: "md" as const,
	};

	test("writes to project/branch subfolders and reads back", async () => {
		const added = await addPlan(base);
		expect(added.path).toContain(join("plans", "nest", "feat-delivery"));
		expect(basename(added.path)).toBe(`${added.meta.id}--plan.md`);

		const fetched = await getPlan(added.meta.id);
		expect(fetched?.meta.branch).toBe("feat/delivery");
		expect(fetched?.branchDir).toBe("feat-delivery");
		expect(fetched?.body.trim()).toBe("# Plan\n\nbody".trim());
	});

	test("filters by project and branch", async () => {
		await addPlan(base);
		await addPlan({ ...base, project: "hostplan", branch: "main" });

		expect(await listPlans()).toHaveLength(2);
		expect(await listPlans({ project: "nest" })).toHaveLength(1);
		expect(await listPlans({ project: "nest", branch: "feat/delivery" })).toHaveLength(1);
		// Filtering accepts either the raw branch or its directory form.
		expect(await listPlans({ project: "nest", branch: "feat-delivery" })).toHaveLength(1);
		expect(await listPlans({ project: "nest", branch: "main" })).toHaveLength(0);
	});

	test("concurrent adds all survive with distinct ids", async () => {
		const added = await Promise.all(
			Array.from({ length: 12 }, (_, i) => addPlan({ ...base, title: `Plan ${i}` })),
		);
		const ids = new Set(added.map((plan) => plan.meta.id));
		expect(ids.size).toBe(12);
		expect(await listPlans()).toHaveLength(12);
	});

	test("reserved project names are escaped away from web routes", () => {
		expect(projectDirName("p")).toBe("_p");
		expect(projectDirName("api")).toBe("_api");
		expect(branchDirName("feat/x")).toBe("feat-x");
	});

	test("remove deletes the file", async () => {
		const added = await addPlan(base);
		expect(await removePlan(added.meta.id)).toBeDefined();
		expect(await getPlan(added.meta.id)).toBeUndefined();
		expect(await removePlan(added.meta.id)).toBeUndefined();
	});

	test("records cwd so deep links know where to open", async () => {
		const added = await addPlan({ ...base, cwd: "/Users/anurag/kafka/nest" });
		expect((await getPlan(added.meta.id))?.meta.cwd).toBe("/Users/anurag/kafka/nest");
	});

	test("a plan stored without cwd stays valid", async () => {
		const added = await addPlan(base);
		expect((await getPlan(added.meta.id))?.meta.cwd).toBeUndefined();
	});

	test("html plans round-trip through the store", async () => {
		const added = await addPlan({
			...base,
			format: "html",
			content: "<h1>Hello</h1>\n",
			title: "Html Plan",
		});
		expect(added.path.endsWith(".html")).toBe(true);
		const fetched = await getPlan(added.meta.id);
		expect(fetched?.meta.format).toBe("html");
		expect(fetched?.body).toBe("<h1>Hello</h1>\n");
	});
});
