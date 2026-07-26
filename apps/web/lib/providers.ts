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
	/** Absolute URL of this plan. Always safe to hand out. */
	planUrl: string;
	/**
	 * Where the plan lives on the *owner's* machine. Omitted for anyone else:
	 * those paths would leak the owner's home directory and username, and are
	 * meaningless on a visitor's machine anyway.
	 */
	planPath?: string;
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

export function buildOpenTargets(input: OpenTargetInput): OpenTarget[] {
	const local = input.planPath !== undefined;

	// Plans stored before `cwd` was recorded still know the file they came from.
	const cwd = local ? (input.cwd ?? (input.source && dirname(input.source))) : undefined;

	// Agents can fetch a URL perfectly well, so a visitor still gets a working
	// handoff — just one that points at the page instead of a path they'd have
	// no way to open.
	const prompt = local
		? `Read the plan at ${input.planPath} and implement it.`
		: `Read the plan at ${input.planUrl} and implement it.`;

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
			url: `claude://code/new?${query({ q: prompt, folder: cwd })}`,
		},
		{
			id: "cursor",
			label: "Cursor",
			// A prompt deeplink is all Cursor takes — no folder, so it lands in
			// whichever window is already open, with the prompt waiting to be sent.
			// It replaces the old `cursor://file` link, which meant nothing to
			// anyone but the owner and so never appeared on a hosted plan.
			hint: "Agent prompt with the plan",
			url: `cursor://anysphere.cursor-deeplink/prompt?${query({ text: prompt })}`,
		},
	];
}
