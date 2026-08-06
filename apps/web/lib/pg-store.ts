import {
	type AddPlanInput,
	branchDirName,
	DEFAULT_PLAN_THEME,
	DEFAULT_STATUS,
	isCode,
	isStatus,
	newCode,
	newId,
	normalizePlanTheme,
	type PlanFilter,
	type PlanMeta,
	type PlanStore,
	projectDirName,
	type StoredPlan,
	slugify,
	type UpdatePlanPatch,
} from "@hostplan/core";
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "plans";

interface PlanRow {
	id: string;
	user_id: string | null;
	title: string;
	project: string;
	branch: string;
	format: string;
	visibility: string;
	status: string;
	theme: string;
	depends_on: string | null;
	code: string | null;
	storage_path: string;
	source: string | null;
	cwd: string | null;
	created_at: string;
	updated_at: string;
}

function metaFromRow(row: PlanRow): PlanMeta {
	return {
		id: row.id,
		title: row.title,
		project: row.project,
		branch: row.branch,
		format: row.format === "html" ? "html" : "md",
		visibility: row.visibility === "public" ? "public" : "private",
		status: isStatus(row.status) ? row.status : DEFAULT_STATUS,
		theme: normalizePlanTheme(row.theme),
		created: row.created_at,
		updated: row.updated_at,
		...(row.depends_on === null ? {} : { dependsOn: row.depends_on }),
		...(row.code === null ? {} : { code: row.code }),
		...(row.source === null ? {} : { source: row.source }),
		...(row.cwd === null ? {} : { cwd: row.cwd }),
	};
}

function planFromRow(row: PlanRow, body: string): StoredPlan {
	return {
		meta: metaFromRow(row),
		body,
		path: row.storage_path,
		projectDir: projectDirName(row.project),
		branchDir: branchDirName(row.branch),
		...(row.user_id === null ? {} : { ownerId: row.user_id }),
	};
}

/** `<user>/<project>/<branch>/<id>--<slug>.<ext>` — the user prefix is what the storage policy keys on. */
function storageKey(userId: string, input: AddPlanInput, id: string): string {
	return [
		userId,
		projectDirName(input.project),
		branchDirName(input.branch),
		`${id}--${slugify(input.title, "plan")}.${input.format}`,
	].join("/");
}

/**
 * Plans indexed in Postgres, content in Storage.
 *
 * The index exists because a public id has to resolve without knowing whose
 * plan it is; walking every user's storage prefix to find one plan does not
 * scale past a handful of accounts.
 *
 * Every call here goes through the caller's own client, so row-level security
 * decides what is visible. Passing an admin client deliberately opts out, and
 * only the share-code path does that.
 */
export function pgPlanStore(db: SupabaseClient, userId?: string): PlanStore {
	async function download(row: PlanRow): Promise<string> {
		const { data, error } = await db.storage.from(BUCKET).download(row.storage_path);
		if (error !== null || data === null) {
			throw new Error(`could not read ${row.storage_path}: ${error?.message ?? "missing"}`);
		}
		return data.text();
	}

	async function rowById(id: string): Promise<PlanRow | undefined> {
		const { data, error } = await db.from("plans").select("*").eq("id", id).maybeSingle();
		// A row hidden by RLS comes back as null, not an error — indistinguishable
		// from absent, which is the behaviour we want.
		if (error !== null) throw new Error(`lookup failed: ${error.message}`);
		return (data as PlanRow | null) ?? undefined;
	}

	return {
		async add(input: AddPlanInput): Promise<StoredPlan> {
			if (userId === undefined) throw new Error("cannot store a plan without an account");

			const id = input.id ?? newId();
			const visibility = input.visibility ?? "private";
			const code = visibility === "private" ? (input.code ?? newCode()) : undefined;
			const path = storageKey(userId, input, id);

			const upload = await db.storage.from(BUCKET).upload(path, input.content, {
				contentType:
					input.format === "html" ? "text/html; charset=utf-8" : "text/markdown; charset=utf-8",
				upsert: true,
			});
			if (upload.error !== null) throw new Error(`upload failed: ${upload.error.message}`);

			const { data, error } = await db
				.from("plans")
				.insert({
					id,
					user_id: userId,
					title: input.title,
					project: input.project,
					branch: input.branch,
					format: input.format,
					visibility,
					status: input.status ?? DEFAULT_STATUS,
					theme: input.theme ?? DEFAULT_PLAN_THEME,
					depends_on: input.dependsOn ?? null,
					code: code ?? null,
					storage_path: path,
					source: input.source ?? null,
					cwd: input.cwd ?? null,
				})
				.select()
				.single();
			if (error !== null) {
				// Don't leave an orphan object behind if the index insert loses a race.
				await db.storage.from(BUCKET).remove([path]);
				throw new Error(`insert failed: ${error.message}`);
			}
			return planFromRow(data as PlanRow, input.content);
		},

		async get(id: string): Promise<StoredPlan | undefined> {
			const row = await rowById(id);
			if (row === undefined) return undefined;
			return planFromRow(row, await download(row));
		},

		/** The index already holds everything but the body — skip the download. */
		async getMeta(id: string): Promise<PlanMeta | undefined> {
			const row = await rowById(id);
			return row === undefined ? undefined : metaFromRow(row);
		},

		async list(filter: PlanFilter = {}): Promise<StoredPlan[]> {
			let query = db.from("plans").select("*").order("updated_at", { ascending: false });
			if (filter.project !== undefined) query = query.eq("project", filter.project);
			if (filter.branch !== undefined) query = query.eq("branch", filter.branch);
			const { data, error } = await query;
			if (error !== null) throw new Error(`list failed: ${error.message}`);

			// Listings show metadata only; fetching every body would mean one storage
			// round trip per row for text nothing renders.
			return (data as PlanRow[]).map((row) => planFromRow(row, ""));
		},

		async update(id: string, patch: UpdatePlanPatch): Promise<StoredPlan | undefined> {
			const row = await rowById(id);
			if (row === undefined) return undefined;

			const visibility = patch.visibility ?? (row.visibility as "public" | "private");
			let code = row.code;
			if (visibility === "public") code = null;
			else if (patch.rotateCode === true || row.code === null || !isCode(row.code))
				code = newCode();
			// Re-privatising issues a fresh code rather than resurrecting the old one:
			// the previous link was public, so it should not silently keep working.
			else if (row.visibility === "public") code = newCode();

			// A revised body goes to the same storage key: same plan, new content.
			if (patch.content !== undefined) {
				const upload = await db.storage.from(BUCKET).upload(row.storage_path, patch.content, {
					contentType:
						row.format === "html" ? "text/html; charset=utf-8" : "text/markdown; charset=utf-8",
					upsert: true,
				});
				if (upload.error !== null) throw new Error(`upload failed: ${upload.error.message}`);
			}

			const { data, error } = await db
				.from("plans")
				.update({
					visibility,
					code,
					...(patch.title === undefined ? {} : { title: patch.title }),
					...(patch.status === undefined ? {} : { status: patch.status }),
					...(patch.theme === undefined ? {} : { theme: patch.theme }),
					...(patch.dependsOn === undefined ? {} : { depends_on: patch.dependsOn }),
				})
				.eq("id", id)
				.select()
				.single();
			if (error !== null) throw new Error(`update failed: ${error.message}`);
			const updated = data as PlanRow;
			return planFromRow(updated, patch.content ?? (await download(updated)));
		},

		async remove(id: string): Promise<StoredPlan | undefined> {
			const row = await rowById(id);
			if (row === undefined) return undefined;
			const body = await download(row).catch(() => "");
			const { error } = await db.from("plans").delete().eq("id", id);
			if (error !== null) throw new Error(`delete failed: ${error.message}`);
			await db.storage.from(BUCKET).remove([row.storage_path]);
			return planFromRow(row, body);
		},
	};
}
