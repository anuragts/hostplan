export const INTEGRATIONS = {
	codex: {
		name: "Codex",
		company: "OpenAI",
		description:
			"Open a Hostplan implementation plan in a new Codex thread with the plan location and working directory prepared for review.",
		handoff:
			"A new thread with a pre-filled prompt and, for a locally owned plan, its working directory.",
		scheme: "codex://threads/new?prompt=…&path=…&originUrl=…",
		limitation:
			"The deep link prepares a prompt; it does not submit the prompt or begin implementation without user action.",
	},
	"claude-code": {
		name: "Claude Code",
		company: "Anthropic",
		description:
			"Open a Hostplan implementation plan in a new Claude Code desktop session with its plan source prepared for review.",
		handoff:
			"A new code session with a pre-filled plan prompt and, for a local plan, the project folder.",
		scheme: "claude://code/new?q=…&folder=…",
		limitation:
			"The receiving desktop app must support the Claude Code URL scheme. The prompt remains unsent until the user confirms it.",
	},
	cursor: {
		name: "Cursor",
		company: "Anysphere",
		description:
			"Open a Hostplan implementation plan as a prepared Cursor agent prompt without copying the plan between tools.",
		handoff: "A pre-filled agent prompt in the current Cursor window.",
		scheme: "cursor://anysphere.cursor-deeplink/prompt?text=…",
		limitation:
			"Cursor's prompt deep link carries no project folder, so the handoff opens in whichever Cursor window is active.",
	},
} as const;

export type IntegrationId = keyof typeof INTEGRATIONS;

export function isIntegrationId(value: string): value is IntegrationId {
	return value in INTEGRATIONS;
}
