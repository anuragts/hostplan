export const PLAN_THEMES = [
	{
		id: "hostplan",
		label: "Hostplan",
		description: "The original dark, focused Hostplan document.",
		scheme: "dark",
	},
	{
		id: "working-draft",
		label: "Working draft",
		description: "Monochrome xerox paper for plans still taking shape.",
		scheme: "light",
	},
	{
		id: "office-memo",
		label: "Office memo",
		description: "Warm paper and typewritten details for handoffs and updates.",
		scheme: "light",
	},
	{
		id: "editorial",
		label: "Editorial",
		description: "A restrained serif report for research and long-form thinking.",
		scheme: "light",
	},
	{
		id: "technical-brief",
		label: "Technical brief",
		description: "Graph-paper cues and blue ink for architecture-heavy plans.",
		scheme: "light",
	},
	{
		id: "executive",
		label: "Executive",
		description: "A crisp, polished report for approved work.",
		scheme: "light",
	},
] as const;

export type PlanTheme = (typeof PLAN_THEMES)[number];
export type PlanThemeId = PlanTheme["id"];

export const DEFAULT_PLAN_THEME: PlanThemeId = "hostplan";
export const PLAN_THEME_IDS = PLAN_THEMES.map((theme) => theme.id) as PlanThemeId[];

const PLAN_THEME_ID_SET = new Set<string>(PLAN_THEME_IDS);

export function isPlanTheme(value: unknown): value is PlanThemeId {
	return typeof value === "string" && PLAN_THEME_ID_SET.has(value);
}

/** Reading old or hand-edited files is forgiving; mutation boundaries are strict. */
export function normalizePlanTheme(value: unknown): PlanThemeId {
	return isPlanTheme(value) ? value : DEFAULT_PLAN_THEME;
}

export function planTheme(id: PlanThemeId): PlanTheme {
	return PLAN_THEMES.find((theme) => theme.id === id) ?? PLAN_THEMES[0];
}
