import { isPlanTheme, type PlanThemeId } from "@hostplan/core/theme";

export interface StoredPlanTheme {
	theme: PlanThemeId;
	mode: "personal";
	savedAt: string;
}

const PREFIX = "hostplan.plan-theme.v1.";

export function planThemeStorageKey(id: string): string {
	return `${PREFIX}${id}`;
}

export function parseStoredPlanTheme(raw: string | null): StoredPlanTheme | undefined {
	if (raw === null) return undefined;
	try {
		const value = JSON.parse(raw) as Partial<StoredPlanTheme>;
		if (value.mode !== "personal" || !isPlanTheme(value.theme)) return undefined;
		if (typeof value.savedAt !== "string") return undefined;
		return { theme: value.theme, mode: "personal", savedAt: value.savedAt };
	} catch {
		return undefined;
	}
}

export function readStoredPlanTheme(id: string): StoredPlanTheme | undefined {
	return parseStoredPlanTheme(window.localStorage.getItem(planThemeStorageKey(id)));
}

export function writeStoredPlanTheme(id: string, theme: PlanThemeId): void {
	const value: StoredPlanTheme = {
		theme,
		mode: "personal",
		savedAt: new Date().toISOString(),
	};
	window.localStorage.setItem(planThemeStorageKey(id), JSON.stringify(value));
}

export function clearStoredPlanTheme(id: string): void {
	window.localStorage.removeItem(planThemeStorageKey(id));
}
