#!/usr/bin/env bun
import { parsePlan } from "@hostplan/core";
/**
 * Backfills the `plans` index from objects already in the bucket.
 *
 * Turning accounts on swaps the store from "walk the bucket" to "query the
 * index", so plans written before the switch resolve to nothing until they have
 * a row. This reads each object, parses the frontmatter that has always been
 * there, and inserts the matching row.
 *
 *   SUPABASE_URL=... SUPABASE_SECRET_KEY=... bun apps/web/scripts/adopt-plans.ts [--owner <user-id>] [--apply]
 *
 * Without --apply it only reports. Without --owner the rows are inserted with a
 * null user_id: they stay readable by public link and by the legacy owner
 * token, but belong to no account until claimed.
 */
import { createClient } from "@supabase/supabase-js";

const BUCKET = "plans";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const owner = args[args.indexOf("--owner") + 1];
const ownerId = args.includes("--owner") && owner !== undefined ? owner : null;

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (url === undefined || key === undefined) {
	console.error("SUPABASE_URL and SUPABASE_SECRET_KEY are required");
	process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

async function listDir(prefix: string): Promise<string[]> {
	const { data, error } = await db.storage.from(BUCKET).list(prefix, { limit: 1000 });
	// A bad key surfaces here first; say so plainly rather than dumping a stack.
	if (error !== null) {
		console.error(`could not read the bucket: ${error.message}`);
		console.error("check SUPABASE_SECRET_KEY — it must be the secret key, not the publishable one");
		process.exit(1);
	}
	return (data ?? []).map((entry) => entry.name);
}

/** Old layout: <project>/<branch>/<id>--<slug>.md — two levels, no user prefix. */
async function findLegacyObjects(): Promise<string[]> {
	const keys: string[] = [];
	for (const project of await listDir("")) {
		// A directory whose name is a uuid is already owned; skip it.
		if (/^[0-9a-f-]{36}$/i.test(project)) continue;
		for (const branch of await listDir(project)) {
			for (const file of await listDir(`${project}/${branch}`)) {
				if (/^[0-9a-z]{6}--.+\.(md|html)$/.test(file)) {
					keys.push(`${project}/${branch}/${file}`);
				}
			}
		}
	}
	return keys;
}

const objects = await findLegacyObjects();
console.log(`found ${objects.length} object(s) in the pre-accounts layout`);

let adopted = 0;
let skipped = 0;

for (const path of objects) {
	const id = path.split("/").pop()?.slice(0, 6) ?? "";
	const { data: existing } = await db.from("plans").select("id").eq("id", id).maybeSingle();
	if (existing !== null) {
		skipped++;
		continue;
	}

	const { data: blob, error } = await db.storage.from(BUCKET).download(path);
	if (error !== null || blob === null) {
		console.warn(`  ! could not read ${path}: ${error?.message}`);
		continue;
	}
	const { meta } = parsePlan(await blob.text(), path.endsWith(".html") ? "html" : "md");

	const row = {
		id,
		user_id: ownerId,
		title: meta.title,
		project: meta.project,
		branch: meta.branch,
		format: meta.format,
		visibility: meta.visibility,
		code: meta.code ?? null,
		storage_path: path,
		source: meta.source ?? null,
		cwd: meta.cwd ?? null,
		created_at: meta.created,
		updated_at: meta.updated,
	};

	console.log(
		`  ${apply ? "adopting" : "would adopt"} ${id}  ${meta.visibility.padEnd(7)} ${meta.title}`,
	);
	if (apply) {
		const { error: insertError } = await db.from("plans").insert(row);
		if (insertError !== null) {
			console.warn(`  ! ${id}: ${insertError.message}`);
			continue;
		}
	}
	adopted++;
}

console.log(
	`\n${apply ? "adopted" : "would adopt"} ${adopted}, already indexed ${skipped}` +
		(apply ? "" : "\n\nre-run with --apply to write the rows"),
);
