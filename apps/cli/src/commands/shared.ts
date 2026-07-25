import { spawn } from "node:child_process";
import {
	detectScope,
	getPlan,
	isId,
	latestPlan,
	type PlanFilter,
	type StoredPlan,
} from "@hostplan/core";
import { die } from "../output";

export interface ScopeOptions {
	project?: string;
	branch?: string;
	all?: boolean;
}

/**
 * With no flags we scope to the current repo and branch — that's the common
 * agent case. Naming a project widens to all of its branches; naming only a
 * branch keeps the detected project, since "branch main of anything" is rarely
 * what anyone means.
 */
export async function resolveFilter(options: ScopeOptions): Promise<PlanFilter> {
	if (options.all === true) return {};
	if (options.project !== undefined && options.branch !== undefined) {
		return { project: options.project, branch: options.branch };
	}
	if (options.project !== undefined) return { project: options.project };
	if (options.branch !== undefined) {
		return { project: (await detectScope()).project, branch: options.branch };
	}
	const scope = await detectScope();
	return { project: scope.project, branch: scope.branch };
}

/** Accepts a bare id, a full plan URL, or the literal `latest`. */
export async function resolveRef(ref: string, filter: PlanFilter): Promise<StoredPlan> {
	if (ref === "latest") {
		const plan = await latestPlan(filter);
		if (plan === undefined) die(`no plans found in ${describeFilter(filter)}`);
		return plan;
	}

	const id = ref.includes("/") ? (ref.split("/").pop() ?? ref) : ref;
	if (!isId(id)) die(`\`${ref}\` is not a plan id, a plan URL, or \`latest\``);

	const plan = await getPlan(id);
	if (plan === undefined) die(`no plan with id \`${id}\``);
	return plan;
}

export function describeFilter(filter: PlanFilter): string {
	if (filter.project === undefined && filter.branch === undefined) return "the store";
	return [filter.project ?? "*", filter.branch ?? "*"].join(" / ");
}

export function openInBrowser(url: string): void {
	const [command, args] =
		process.platform === "darwin"
			? ["open", [url]]
			: process.platform === "win32"
				? ["cmd", ["/c", "start", "", url]]
				: ["xdg-open", [url]];
	const child = spawn(command as string, args as string[], { stdio: "ignore", detached: true });
	child.unref();
}
