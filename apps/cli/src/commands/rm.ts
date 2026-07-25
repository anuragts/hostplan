import { displayPath, removePlan } from "@hostplan/core";
import { printJson, style } from "../output";
import { resolveFilter, resolveRef, type ScopeOptions } from "./shared";

export interface RmOptions extends ScopeOptions {
	json?: boolean;
}

export async function rmCommand(ref: string, options: RmOptions): Promise<void> {
	const plan = await resolveRef(ref, await resolveFilter(options));
	await removePlan(plan.meta.id);

	if (options.json === true) {
		printJson({ removed: plan.meta.id, title: plan.meta.title, path: plan.path });
		return;
	}
	process.stdout.write(
		`${style.red("✗")} removed  ${style.bold(plan.meta.title)}  ${style.dim(`(${plan.meta.id})`)}\n  ${style.dim(displayPath(plan.path))}\n`,
	);
}
