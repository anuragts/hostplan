import {
	isPlanTheme,
	PLAN_THEME_IDS,
	PLAN_THEMES,
	type PlanThemeId,
	updatePlan,
} from "@hostplan/core";
import { die, printJson, style, table } from "../output";
import { resolveFilter, resolveRef, type ScopeOptions, syncPatch } from "./shared";

export interface ThemeOptions extends ScopeOptions {
	json?: boolean;
	list?: boolean;
}

function parseTheme(value: string): PlanThemeId {
	if (isPlanTheme(value)) return value;
	return die(`theme must be one of ${PLAN_THEME_IDS.join(", ")}, got \`${value}\``);
}

function listThemes(json: boolean): void {
	if (json) {
		printJson({ themes: PLAN_THEMES });
		return;
	}
	process.stdout.write(
		`${table(
			PLAN_THEMES.map((theme) => [style.cyan(theme.id), theme.label, style.dim(theme.description)]),
		)}\n`,
	);
}

export async function themeCommand(
	ref: string | undefined,
	theme: string | undefined,
	options: ThemeOptions,
): Promise<void> {
	if (options.list === true) {
		if (ref !== undefined || theme !== undefined) die("pass either --list or a plan reference");
		listThemes(options.json === true);
		return;
	}
	if (ref === undefined) return die("pass a plan id, URL, or `latest` (or use --list)");

	const plan = await resolveRef(ref, await resolveFilter(options));
	if (theme === undefined) {
		if (options.json === true) {
			printJson({ id: plan.meta.id, theme: plan.meta.theme });
			return;
		}
		process.stdout.write(`${plan.meta.theme}\n`);
		return;
	}

	const next = parseTheme(theme);
	const updated = await updatePlan(plan.meta.id, { theme: next });
	if (updated === undefined) return die(`could not update \`${plan.meta.id}\``);
	await syncPatch(plan.meta.id, { theme: next });

	if (options.json === true) {
		printJson({ id: updated.meta.id, theme: updated.meta.theme, updated: updated.meta.updated });
		return;
	}
	process.stdout.write(
		`${style.green("✓")} themed  ${style.bold(updated.meta.title)}  ${style.dim("·")}  ${style.cyan(next)}\n`,
	);
}
