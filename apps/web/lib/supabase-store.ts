import {
	type AddPlanInput,
	branchDirName,
	DEFAULT_STATUS,
	formatFromPath,
	newCode,
	newId,
	type PlanFilter,
	type PlanMeta,
	type PlanStore,
	parsePlan,
	projectDirName,
	type StoredPlan,
	serializePlan,
	slugify,
	type UpdatePlanPatch,
} from "@hostplan/core";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "plans";

/**
 * Object keys mirror the local directory layout exactly
 * (`<project>/<branch>/<id>--<slug>.md`), so a store can be moved between the
 * filesystem and the bucket by copying files. As locally, there is no index:
 * the key listing is the index and each object carries its own metadata.
 */
/**
 * Supabase's newer `sb_secret_…` key and the legacy `service_role` JWT are both
 * accepted — new projects only offer the former, older ones only the latter.
 */
export function secretKey(): string | undefined {
	return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function client(): SupabaseClient {
	const url = process.env.SUPABASE_URL;
	const key = secretKey();
	if (url === undefined || key === undefined) {
		throw new Error(
			"SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) are required",
		);
	}
	// A secret key, and only ever server-side: the bucket is private and this
	// key bypasses row-level security entirely.
	return createClient(url, key, { auth: { persistSession: false } });
}

interface ObjectRef {
	key: string;
	id: string;
	projectDir: string;
	branchDir: string;
}

const KEY_PATTERN = /^([0-9a-z]{6})--(.+)\.(md|html)$/;

async function listDir(supabase: SupabaseClient, prefix: string): Promise<string[]> {
	const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
	// A missing prefix comes back as an empty list, not an error — so a real
	// error means the bucket is unreachable. Swallowing it would render an
	// outage as "you have no plans", and worse, would let `add` believe every
	// id is free.
	if (error !== null) throw new Error(`supabase list failed: ${error.message}`);
	return (data ?? []).map((entry) => entry.name);
}

/** Walks the two-level prefix tree — the same shape as the local fs walk. */
async function listObjects(supabase: SupabaseClient): Promise<ObjectRef[]> {
	const refs: ObjectRef[] = [];
	for (const projectDir of await listDir(supabase, "")) {
		for (const branchDir of await listDir(supabase, projectDir)) {
			for (const name of await listDir(supabase, `${projectDir}/${branchDir}`)) {
				const id = name.match(KEY_PATTERN)?.[1];
				if (id === undefined) continue;
				refs.push({ key: `${projectDir}/${branchDir}/${name}`, id, projectDir, branchDir });
			}
		}
	}
	return refs;
}

async function download(supabase: SupabaseClient, ref: ObjectRef): Promise<StoredPlan | undefined> {
	const { data, error } = await supabase.storage.from(BUCKET).download(ref.key);
	// A single unreadable object shouldn't take down a whole listing, so this
	// one stays soft — the key was in the listing a moment ago.
	if (error !== null || data === null) return undefined;
	const raw = await data.text();
	const { meta, body } = parsePlan(raw, formatFromPath(ref.key));
	return {
		// The key is authoritative for the id, as the filename is locally.
		meta: { ...meta, id: ref.id },
		body,
		path: ref.key,
		projectDir: ref.projectDir,
		branchDir: ref.branchDir,
	};
}

async function upload(supabase: SupabaseClient, key: string, contents: string): Promise<void> {
	const { error } = await supabase.storage
		.from(BUCKET)
		.upload(key, contents, { contentType: "text/markdown; charset=utf-8", upsert: true });
	if (error !== null) throw new Error(`supabase upload failed: ${error.message}`);
}

function matches(plan: StoredPlan, filter: PlanFilter): boolean {
	if (filter.project !== undefined && plan.projectDir !== projectDirName(filter.project)) {
		return false;
	}
	if (filter.branch !== undefined && plan.branchDir !== branchDirName(filter.branch)) {
		return false;
	}
	return true;
}

export const supabasePlanStore: PlanStore = {
	async add(input: AddPlanInput): Promise<StoredPlan> {
		const supabase = client();
		const taken = new Set((await listObjects(supabase)).map((ref) => ref.id));
		let id = newId();
		for (let attempt = 0; attempt < 20 && taken.has(id); attempt++) id = newId();
		if (taken.has(id)) throw new Error("could not allocate a unique plan id");

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
			status: input.status ?? DEFAULT_STATUS,
			...(input.dependsOn === undefined ? {} : { dependsOn: input.dependsOn }),
			...(visibility === "private" ? { code: newCode() } : {}),
			...(input.source === undefined ? {} : { source: input.source }),
			...(input.cwd === undefined ? {} : { cwd: input.cwd }),
		};

		const projectDir = projectDirName(input.project);
		const branchDir = branchDirName(input.branch);
		const key = `${projectDir}/${branchDir}/${id}--${slugify(input.title, "plan")}.${input.format}`;
		await upload(supabase, key, serializePlan(meta, input.content, input.extraFrontmatter ?? {}));

		return { meta, body: input.content, path: key, projectDir, branchDir };
	},

	async get(id: string): Promise<StoredPlan | undefined> {
		const supabase = client();
		const ref = (await listObjects(supabase)).find((candidate) => candidate.id === id);
		return ref === undefined ? undefined : download(supabase, ref);
	},

	async list(filter: PlanFilter = {}): Promise<StoredPlan[]> {
		const supabase = client();
		const refs = await listObjects(supabase);
		const plans = await Promise.all(refs.map((ref) => download(supabase, ref)));
		return plans
			.filter((plan): plan is StoredPlan => plan !== undefined)
			.filter((plan) => matches(plan, filter))
			.sort((a, b) => b.meta.updated.localeCompare(a.meta.updated));
	},

	async update(id: string, patch: UpdatePlanPatch): Promise<StoredPlan | undefined> {
		const supabase = client();
		const ref = (await listObjects(supabase)).find((candidate) => candidate.id === id);
		if (ref === undefined) return undefined;
		const plan = await download(supabase, ref);
		if (plan === undefined) return undefined;

		const visibility = patch.visibility ?? plan.meta.visibility;
		const code =
			visibility === "public"
				? undefined
				: patch.rotateCode === true || plan.meta.code === undefined
					? newCode()
					: plan.meta.code;

		const meta: PlanMeta = {
			...plan.meta,
			...(patch.title === undefined ? {} : { title: patch.title }),
			...(patch.status === undefined ? {} : { status: patch.status }),
			visibility,
			updated: new Date().toISOString(),
		};
		if (code === undefined) delete meta.code;
		else meta.code = code;
		if (patch.dependsOn === null) delete meta.dependsOn;
		else if (patch.dependsOn !== undefined) meta.dependsOn = patch.dependsOn;

		const body = patch.content ?? plan.body;
		await upload(supabase, ref.key, serializePlan(meta, body));
		return { ...plan, meta, body };
	},

	async remove(id: string): Promise<StoredPlan | undefined> {
		const supabase = client();
		const ref = (await listObjects(supabase)).find((candidate) => candidate.id === id);
		if (ref === undefined) return undefined;
		const plan = await download(supabase, ref);
		await supabase.storage.from(BUCKET).remove([ref.key]);
		return plan;
	},
};
