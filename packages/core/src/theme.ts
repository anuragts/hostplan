export type PlanThemeId = "hostplan";

export const DEFAULT_PLAN_THEME: PlanThemeId = "hostplan";

/** Old files may still carry a retired theme id; every plan now uses the base reader. */
export function normalizePlanTheme(_value: unknown): PlanThemeId {
	return DEFAULT_PLAN_THEME;
}
