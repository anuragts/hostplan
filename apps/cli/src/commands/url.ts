import { planUrl, resolvePort } from "@hostplan/core";
import { ensureServer } from "../daemon";
import { openInBrowser, resolveFilter, resolveRef, type ScopeOptions } from "./shared";

export interface UrlOptions extends ScopeOptions {
	serve: boolean;
}

export async function urlCommand(ref: string, options: UrlOptions): Promise<void> {
	const plan = await resolveRef(ref, await resolveFilter(options));
	const port = options.serve ? (await ensureServer()).port : await resolvePort();
	process.stdout.write(`${planUrl(port, plan.meta.id)}\n`);
}

export async function openCommand(ref: string, options: ScopeOptions): Promise<void> {
	const plan = await resolveRef(ref, await resolveFilter(options));
	const { port } = await ensureServer();
	const url = planUrl(port, plan.meta.id);
	openInBrowser(url);
	process.stdout.write(`${url}\n`);
}
