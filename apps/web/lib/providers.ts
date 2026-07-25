import { dirname } from "node:path";

export type ProviderId = "codex" | "claude-code" | "cursor";

export interface OpenTarget {
	id: ProviderId;
	label: string;
	/** Custom-scheme URL handed straight to the OS. */
	url: string;
	/** Shown under the label in the menu, so it's clear what each one will do. */
	hint: string;
}

export interface OpenTargetInput {
	planPath: string;
	planUrl: string;
	cwd?: string;
	source?: string;
}

/**
 * `+` for a space is legal in a query string but not every handler's parser
 * treats it that way, so encode everything explicitly with %20.
 */
function query(params: Record<string, string | undefined>): string {
	return Object.entries(params)
		.filter((entry): entry is [string, string] => entry[1] !== undefined)
		.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
		.join("&");
}

/** Encodes each segment but keeps the separators, for `scheme://file/a/b c.md`. */
function encodePath(path: string): string {
	return path.split("/").map(encodeURIComponent).join("/");
}

export function buildOpenTargets(input: OpenTargetInput): OpenTarget[] {
	// Plans stored before `cwd` was recorded still know the file they came from.
	const cwd = input.cwd ?? (input.source === undefined ? undefined : dirname(input.source));
	const prompt = `Read the plan at ${input.planPath} and implement it.`;

	return [
		{
			id: "codex",
			label: "Codex",
			hint: "New thread with the plan",
			url: `codex://threads/new?${query({ prompt, path: cwd, originUrl: input.planUrl })}`,
		},
		{
			id: "claude-code",
			label: "Claude Code",
			hint: "New session with the plan",
			// The desktop app's own handler. `claude-cli://open` also works but spawns
			// a terminal window instead of a Code tab.
			url: `claude://code/new?${query({ q: prompt, folder: cwd })}`,
		},
		{
			id: "cursor",
			// Cursor has no agent deep link, so this opens the plan file itself.
			label: "Cursor",
			hint: "Open the plan file",
			url: `cursor://file${encodePath(input.planPath)}`,
		},
	];
}
