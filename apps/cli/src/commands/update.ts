import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
	displayPath,
	ensureDir,
	readSourceFrontmatter,
	storeRoot,
	updatePlan,
	writeFileAtomic,
} from "@hostplan/core";
import { die, printJson, style } from "../output";
import { resolveFilter, resolveRef, type ScopeOptions, syncPatch } from "./shared";

export interface UpdateOptions extends ScopeOptions {
	content?: string;
	title?: string;
	json?: boolean;
}

/**
 * Revise a plan in place: same id, same URL, same code — new body. The
 * previous revision is copied aside first, so an update can be undone by hand
 * and a reviewer can always ask what changed.
 */
export async function updateCommand(
	ref: string,
	file: string | undefined,
	options: UpdateOptions,
): Promise<void> {
	const plan = await resolveRef(ref, await resolveFilter(options));

	if (file !== undefined && options.content !== undefined) {
		die("pass either a file or --content, not both");
	}
	let raw: string;
	if (file !== undefined) {
		raw = await readFile(resolve(file), "utf8").catch(() => die(`cannot read \`${file}\``));
	} else if (options.content !== undefined) {
		raw = options.content;
	} else {
		return die("nothing to update with — pass a plan file or --content");
	}

	// Keep only the body; hostplan's own frontmatter is about to be rewritten.
	const content = plan.meta.format === "md" ? readSourceFrontmatter(raw).content : raw;

	// Archive the outgoing revision before touching anything.
	const stamp = plan.meta.updated.replace(/[:.]/g, "-");
	const archiveDir = join(storeRoot(), "revisions", plan.meta.id);
	await ensureDir(archiveDir);
	const archive = join(archiveDir, `${stamp}.${plan.meta.format}`);
	await writeFileAtomic(archive, await readFile(plan.path, "utf8"));

	const updated = await updatePlan(plan.meta.id, {
		content,
		...(options.title === undefined ? {} : { title: options.title }),
	});
	if (updated === undefined) die(`could not update \`${plan.meta.id}\``);
	await syncPatch(plan.meta.id, {
		content,
		...(options.title === undefined ? {} : { title: options.title }),
	});

	if (options.json === true) {
		printJson({ ...updated.meta, path: updated.path, previousRevision: archive });
		return;
	}
	process.stdout.write(
		[
			`${style.green("✓")} revised  ${style.bold(updated.meta.title)}  ${style.dim("·")}  ${style.cyan(updated.meta.id)}  ${style.dim("· same link, new body")}`,
			`  ${style.dim(`previous revision kept at ${displayPath(archive)}`)}`,
		].join("\n") + "\n",
	);
}
