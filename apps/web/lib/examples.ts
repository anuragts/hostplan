export const EXAMPLES = {
	"plan-lifecycle": {
		title: "Run a plan through draft, approval, execution, and completion",
		shortTitle: "Plan lifecycle",
		description:
			"Use explicit status transitions and addressable tasks so a coding-agent plan cannot silently move from proposal to implementation.",
		scenario:
			"A human asks for a repository change, reviews the implementation plan, approves it, and resumes the work in another coding-agent session.",
		commands: `hsp add PLAN.md
hsp status <id> approved
hsp status <id> in-progress
hsp tasks <id>
hsp check <id> 1 2
hsp status <id> done`,
		proof:
			"`hsp status <id>` returns done, every required checkbox is complete, and the implementation checks named in the plan have passed.",
	},
	"plan-stack": {
		title: "Split a large implementation into an ordered plan stack",
		shortTitle: "Plan stack",
		description:
			"Chain schema, API, UI, and rollout plans so each coding-agent session receives one actionable step with explicit dependencies.",
		scenario:
			"A feature is too large for one safe implementation turn and later phases must not begin before foundational work is complete.",
		commands: `hsp stack 01-schema.md 02-api.md 03-ui.md 04-rollout.md
hsp stack <first-id>
hsp next
hsp status <first-id> done
hsp next`,
		proof:
			"`hsp next` returns only the first unblocked plan, and marking one step done prints which dependent step becomes actionable.",
	},
	"agent-handoff": {
		title: "Hand a plan from one coding-agent session to another",
		shortTitle: "Agent handoff",
		description:
			"Store one canonical plan, share its URL, preserve project context, and let the receiving agent retrieve the current revision before implementing.",
		scenario:
			"One agent researches and plans a change; a fresh Codex, Claude Code, or Cursor session implements it without relying on the original chat scrollback.",
		commands: `hsp add PLAN.md
hsp status <id> approved
hsp share <id>

# In the receiving session
hsp get <id>
hsp status <id> in-progress
hsp tasks <id>`,
		proof:
			"The receiving session reads the same plan id and current revision, sees the correct approval state, and records progress on the shared task list.",
	},
} as const;

export type ExampleId = keyof typeof EXAMPLES;

export function isExampleId(value: string): value is ExampleId {
	return value in EXAMPLES;
}
