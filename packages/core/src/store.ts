import { readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import type { Visibility } from "./access";
import { newCode } from "./code";
import { ID_LENGTH, newId } from "./id";
import {
	formatFromPath,
	type Plan,
	type PlanFormat,
	type PlanMeta,
	readPlanFile,
	serializePlan,
	writeFileAtomic,
} from "./meta";
import { ensureDir, plansRoot } from "./paths";
import { slugify } from "./slug";

/**
 * Directory names that would be shadowed by, or shadow, a web route. A project
 * with one of these names gets an underscore prefix instead of silently
 * disappearing behind `/p/[id]`.
 */
const RESERVED_DIR_NAMES = new Set(["p", "api", "_next", "favicon.ico"]);

const PLAN_FILE_PATTERN = new RegExp(`^([0-9a-z]{${ID_LENGTH}})--(.+)\\.(md|html)$`);

export interface StoredPlan extends Plan {
	/** Directory name under `plans/` — this is what appears in web URLs. */
	projectDir: string;
	branchDir: string;
}

export interface PlanFilter {
	project?: string;
	branch?: string;
}

export interface AddPlanInput {
	content: string;
	title: string;
	project: string;
	branch: string;
	format: PlanFormat;
	/** Defaults to private — publishing should be deliberate, not accidental. */
	visibility?: Visibility;
	/**
	 * Reuse an existing identity instead of minting one. This is what makes a
	 * pushed plan the *same* plan on both sides rather than a copy that happens
	 * to have the same text under a different id and code.
	 */
	id?: string;
	code?: string;
	source?: string;
	cwd?: string;
	extraFrontmatter?: Record<string, unknown>;
}

export function projectDirName(project: string): string {
	const slug = slugify(project, "unknown-project");
	return RESERVED_DIR_NAMES.has(slug) ? `_${slug}` : slug;
}

export function branchDirName(branch: string): string {
	return slugify(branch, "no-branch");
}

export function planDir(project: string, branch: string): string {
	return join(plansRoot(), projectDirName(project), branchDirName(branch));
}

async function readdirSafe(dir: string): Promise<string[]> {
	try {
		const entries = await readdir(dir, { withFileTypes: true });
		return entries.filter((e) => e.isDirectory()).map((e) => e.name);
	} catch {
		return [];
	}
}

interface PlanFileRef {
	path: string;
	id: string;
	projectDir: string;
	branchDir: string;
}

/**
 * The directory tree is the index — there is no manifest to keep in sync, so
 * concurrent writers can never corrupt it.
 */
async function listPlanFiles(): Promise<PlanFileRef[]> {
	const root = plansRoot();
	const refs: PlanFileRef[] = [];
	for (const projectDir of await readdirSafe(root)) {
		for (const branchDir of await readdirSafe(join(root, projectDir))) {
			const dir = join(root, projectDir, branchDir);
			let entries: string[];
			try {
				entries = (await readdir(dir, { withFileTypes: true }))
					.filter((e) => e.isFile())
					.map((e) => e.name);
			} catch {
				continue;
			}
			for (const name of entries) {
				const id = name.match(PLAN_FILE_PATTERN)?.[1];
				if (id === undefined) continue;
				refs.push({ path: join(dir, name), id, projectDir, branchDir });
			}
		}
	}
	return refs;
}

async function hydrate(ref: PlanFileRef): Promise<StoredPlan | undefined> {
	try {
		const plan = await readPlanFile(ref.path);
		// The filename is authoritative for the id; frontmatter can be hand-edited.
		return {
			...plan,
			meta: { ...plan.meta, id: ref.id },
			projectDir: ref.projectDir,
			branchDir: ref.branchDir,
		};
	} catch {
		return undefined;
	}
}

function newest(a: StoredPlan, b: StoredPlan): number {
	return b.meta.updated.localeCompare(a.meta.updated);
}

function matches(plan: StoredPlan, filter: PlanFilter): boolean {
	const { project, branch } = filter;
	if (project !== undefined) {
		const wanted = projectDirName(project);
		if (plan.projectDir !== wanted) return false;
	}
	if (branch !== undefined) {
		const wanted = branchDirName(branch);
		if (plan.branchDir !== wanted) return false;
	}
	return true;
}

export async function getPlan(id: string): Promise<StoredPlan | undefined> {
	const ref = (await listPlanFiles()).find((candidate) => candidate.id === id);
	return ref === undefined ? undefined : hydrate(ref);
}

export async function listPlans(filter: PlanFilter = {}): Promise<StoredPlan[]> {
	const refs = await listPlanFiles();
	const plans = await Promise.all(refs.map(hydrate));
	return plans
		.filter((plan): plan is StoredPlan => plan !== undefined)
		.filter((plan) => matches(plan, filter))
		.sort(newest);
}

export async function latestPlan(filter: PlanFilter = {}): Promise<StoredPlan | undefined> {
	return (await listPlans(filter))[0];
}

export async function removePlan(id: string): Promise<StoredPlan | undefined> {
	const plan = await getPlan(id);
	if (plan === undefined) return undefined;
	await rm(plan.path);
	return plan;
}

async function allocateId(): Promise<string> {
	const taken = new Set((await listPlanFiles()).map((ref) => ref.id));
	for (let attempt = 0; attempt < 20; attempt++) {
		const id = newId();
		if (!taken.has(id)) return id;
	}
	throw new Error("could not allocate a unique plan id");
}

export async function addPlan(input: AddPlanInput): Promise<StoredPlan> {
	const id = input.id ?? (await allocateId());
	const now = new Date().toISOString();
	const visibility = input.visibility ?? "private";
	const meta: PlanMeta = {
		id,
		title: input.title,
		project: input.project,
		branch: input.branch,
		format: input.format,
		created: now,
		updated: now,
		visibility,
		// Public plans carry no code — there would be nothing for it to gate.
		...(visibility === "private" ? { code: input.code ?? newCode() } : {}),
		...(input.source === undefined ? {} : { source: input.source }),
		...(input.cwd === undefined ? {} : { cwd: input.cwd }),
	};

	const dir = planDir(input.project, input.branch);
	await ensureDir(dir);
	const path = join(dir, `${id}--${slugify(input.title, "plan")}.${input.format}`);
	await writeFileAtomic(path, serializePlan(meta, input.content, input.extraFrontmatter ?? {}));

	return {
		meta,
		body: input.content,
		path,
		projectDir: projectDirName(input.project),
		branchDir: branchDirName(input.branch),
	};
}

export interface UpdatePlanPatch {
	visibility?: Visibility;
	/** Issue a fresh share code, invalidating any link already handed out. */
	rotateCode?: boolean;
	title?: string;
}

/**
 * Rewrites a plan's metadata in place, keeping the body byte-identical. The
 * filename is left alone even when the title changes — the id is what the
 * filename is for, and renaming would break links already shared.
 */
export async function updatePlan(
	id: string,
	patch: UpdatePlanPatch,
): Promise<StoredPlan | undefined> {
	const plan = await getPlan(id);
	if (plan === undefined) return undefined;

	const visibility = patch.visibility ?? plan.meta.visibility;
	// A private plan always ends up with a code: either the one it had, a
	// rotated one, or a fresh one if it is arriving from public (or predates
	// codes entirely).
	const code =
		visibility === "public"
			? undefined
			: patch.rotateCode === true || plan.meta.code === undefined
				? newCode()
				: plan.meta.code;

	const meta: PlanMeta = {
		...plan.meta,
		...(patch.title === undefined ? {} : { title: patch.title }),
		visibility,
		updated: new Date().toISOString(),
	};
	if (code === undefined) delete meta.code;
	else meta.code = code;

	await writeFileAtomic(plan.path, serializePlan(meta, plan.body));
	return { ...plan, meta };
}

export interface ProjectSummary {
	dir: string;
	name: string;
	planCount: number;
	branchCount: number;
	updated: string;
}

export interface BranchSummary {
	dir: string;
	name: string;
	planCount: number;
	updated: string;
}

export function summarizeProjects(plans: StoredPlan[]): ProjectSummary[] {
	const byDir = new Map<string, StoredPlan[]>();
	for (const plan of plans) {
		const bucket = byDir.get(plan.projectDir);
		if (bucket === undefined) byDir.set(plan.projectDir, [plan]);
		else bucket.push(plan);
	}
	return [...byDir.entries()]
		.map(([dir, group]) => ({
			dir,
			name: group[0]?.meta.project ?? dir,
			planCount: group.length,
			branchCount: new Set(group.map((plan) => plan.branchDir)).size,
			updated: group.reduce((max, p) => (p.meta.updated > max ? p.meta.updated : max), ""),
		}))
		.sort((a, b) => b.updated.localeCompare(a.updated));
}

export function summarizeBranches(plans: StoredPlan[]): BranchSummary[] {
	const byDir = new Map<string, StoredPlan[]>();
	for (const plan of plans) {
		const bucket = byDir.get(plan.branchDir);
		if (bucket === undefined) byDir.set(plan.branchDir, [plan]);
		else bucket.push(plan);
	}
	return [...byDir.entries()]
		.map(([dir, group]) => ({
			dir,
			name: group[0]?.meta.branch ?? dir,
			planCount: group.length,
			updated: group.reduce((max, p) => (p.meta.updated > max ? p.meta.updated : max), ""),
		}))
		.sort((a, b) => b.updated.localeCompare(a.updated));
}

export { formatFromPath };
