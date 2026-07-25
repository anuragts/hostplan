import { displayPath, planUrl, resolvePort } from "@hostplan/core";
import { printJson, style, table } from "../output";
import { resolveFilter, resolveRef, type ScopeOptions } from "./shared";

export interface GetOptions extends ScopeOptions {
	json?: boolean;
	meta?: boolean;
}

export async function getCommand(ref: string, options: GetOptions): Promise<void> {
	const plan = await resolveRef(ref, await resolveFilter(options));
	const url = planUrl(await resolvePort(), plan.meta.id);

	if (options.json === true) {
		printJson({ ...plan.meta, url, path: plan.path, body: plan.body });
		return;
	}

	if (options.meta === true) {
		process.stdout.write(
			`${table([
				[style.dim("id"), plan.meta.id],
				[style.dim("title"), plan.meta.title],
				[style.dim("project"), plan.meta.project],
				[style.dim("branch"), plan.meta.branch],
				[style.dim("format"), plan.meta.format],
				[style.dim("created"), plan.meta.created],
				[style.dim("updated"), plan.meta.updated],
				[style.dim("url"), url],
				[style.dim("path"), displayPath(plan.path)],
				...(plan.meta.cwd === undefined ? [] : [[style.dim("cwd"), displayPath(plan.meta.cwd)]]),
				...(plan.meta.source === undefined
					? []
					: [[style.dim("source"), displayPath(plan.meta.source)]]),
			])}\n`,
		);
		return;
	}

	// Bare body on stdout — this is the pipe-friendly path agents use.
	process.stdout.write(plan.body.endsWith("\n") ? plan.body : `${plan.body}\n`);
}
