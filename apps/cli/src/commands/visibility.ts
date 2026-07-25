import { displayPath, planUrl, resolvePort, shareUrls, updatePlan } from "@hostplan/core";
import { die, printJson, style } from "../output";
import { resolveFilter, resolveRef, type ScopeOptions } from "./shared";

export interface VisibilityOptions extends ScopeOptions {
	json?: boolean;
}

async function origin(): Promise<string> {
	return `http://localhost:${await resolvePort()}`;
}

/** The two link forms, printed the same way everywhere they appear. */
function renderLinks(links: { url: string; codedUrl?: string }): string {
	if (links.codedUrl === undefined) {
		return `${style.dim("→")} ${style.blue(links.url)}`;
	}
	return [
		`${style.dim("→")} ${style.blue(links.url)}  ${style.dim("asks for the code")}`,
		`${style.dim("→")} ${style.blue(links.codedUrl)}  ${style.dim("opens directly")}`,
	].join("\n");
}

export async function shareCommand(ref: string, options: VisibilityOptions): Promise<void> {
	const plan = await resolveRef(ref, await resolveFilter(options));
	const links = shareUrls(await origin(), plan.meta);

	if (options.json === true) {
		printJson({ ...plan.meta, ...links });
		return;
	}

	process.stdout.write(
		[
			`${style.bold(plan.meta.title)}  ${style.dim("·")}  ${style.cyan(plan.meta.id)}  ${style.dim("·")}  ${plan.meta.visibility}`,
			renderLinks(links),
		].join("\n") + "\n",
	);
}

export function publishCommand(makePublic: boolean) {
	return async (ref: string, options: VisibilityOptions): Promise<void> => {
		const plan = await resolveRef(ref, await resolveFilter(options));
		const updated = await updatePlan(plan.meta.id, {
			visibility: makePublic ? "public" : "private",
		});
		if (updated === undefined) die(`could not update \`${plan.meta.id}\``);

		const links = shareUrls(await origin(), updated.meta);
		if (options.json === true) {
			printJson({ ...updated.meta, ...links });
			return;
		}

		process.stdout.write(
			[
				`${style.green("✓")} ${makePublic ? "published" : "made private"}  ${style.bold(updated.meta.title)}  ${style.dim("·")}  ${style.cyan(updated.meta.id)}`,
				renderLinks(links),
				...(makePublic ? [] : [`  ${style.dim("any link shared before now has stopped working")}`]),
			].join("\n") + "\n",
		);
	};
}

export async function rotateCodeCommand(ref: string, options: VisibilityOptions): Promise<void> {
	const plan = await resolveRef(ref, await resolveFilter(options));
	if (plan.meta.visibility === "public") {
		die(`\`${plan.meta.id}\` is public — it has no code. Run \`hsp unpublish\` first.`);
	}

	const updated = await updatePlan(plan.meta.id, { rotateCode: true });
	if (updated === undefined) die(`could not update \`${plan.meta.id}\``);

	const links = shareUrls(await origin(), updated.meta);
	if (options.json === true) {
		printJson({ ...updated.meta, ...links });
		return;
	}

	process.stdout.write(
		[
			`${style.green("✓")} new code  ${style.cyan(updated.meta.code ?? "")}  ${style.dim(`for ${updated.meta.title}`)}`,
			renderLinks(links),
			`  ${style.dim("the previous code no longer opens this plan")}`,
		].join("\n") + "\n",
	);
}

export { displayPath, planUrl };
