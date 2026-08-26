import {
	ACTIVE_CONTRACT_ARTICLE_PATH,
	absoluteUrl,
	CROSS_SESSION_HANDOFF_ARTICLE_PATH,
} from "@/lib/site";

export const ACTIVE_CONTRACT_ARTICLE = {
	slug: "2026-08-13-active-contract-ledger",
	path: ACTIVE_CONTRACT_ARTICLE_PATH,
	title: "Use an active-contract ledger to resume coding-agent work safely",
	shortTitle: "Active-contract ledger",
	description:
		"A practical plan format for resuming long-running coding-agent work without losing scope, authority, progress, or verification evidence.",
	published: "2026-08-13",
	updated: "2026-08-13",
	dateLabel: "August 13, 2026",
	imagePath: "/daily-sunrise/active-contract-ledger.svg",
	sources: [
		{
			name: "Claude Code v2.1.229 release",
			url: "https://github.com/anthropics/claude-code/releases/tag/v2.1.229",
			dateLabel: "Published 2026-08-12 at 20:56 UTC",
			note: "Documents continuing the latest Remote Control session and hardens long-running sessions.",
		},
		{
			name: "OpenAI Codex August 2026 changelog",
			url: "https://developers.openai.com/codex/changelog",
			dateLabel: "Published 2026-08-10",
			note: "Introduces Daybreak access tiers and recommends scoped, isolated, least-privilege work.",
		},
		{
			name: "OpenAI Models and Trusted Access",
			url: "https://learn.chatgpt.com/docs/cyber-safety",
			dateLabel: "Accessed 2026-08-13; no publication date stated",
			note: "Defines authorization boundaries for advanced defensive-security work.",
		},
	] as const,
} as const;

export const CROSS_SESSION_HANDOFF_ARTICLE = {
	slug: "2026-08-14-cross-session-handoff",
	path: CROSS_SESSION_HANDOFF_ARTICLE_PATH,
	title: "Hand off coding-agent work without making the message the source of truth",
	shortTitle: "Cross-session handoff",
	description:
		"A durable handoff protocol for live coding-agent sessions: send a small wake-up message, then recover scope, state, and evidence from one canonical plan.",
	published: "2026-08-14",
	updated: "2026-08-14",
	dateLabel: "August 14, 2026",
	imagePath: "/daily-sunrise/cross-session-handoff.svg",
	sources: [
		{
			name: "Claude Code v2.1.232 release",
			url: "https://github.com/anthropics/claude-code/releases/tag/v2.1.232",
			dateLabel: "Published 2026-08-13 at 23:29 UTC",
			note: "Adds named cross-session mentions and direct SendMessage delivery between live sessions.",
		},
		{
			name: "Claude Code session management",
			url: "https://code.claude.com/docs/en/sessions",
			dateLabel: "Accessed 2026-08-14; no publication date stated",
			note: "Documents naming, resuming, branching, and worktree-aware session lookup.",
		},
		{
			name: "Claude Code Remote Control",
			url: "https://code.claude.com/docs/en/remote-control",
			dateLabel: "Accessed 2026-08-14; no publication date stated",
			note: "Explains that remote clients continue a local session while its environment stays local.",
		},
		{
			name: "GitHub Agents tab announcement",
			url: "https://github.blog/changelog/2026-01-26-introducing-the-agents-tab-in-your-repository/",
			dateLabel: "Published 2026-01-26",
			note: "Documents continuing a Copilot coding-agent session in the CLI from the repository session surface.",
		},
	] as const,
} as const;

export const DAILY_SUNRISE_ARTICLES = [
	CROSS_SESSION_HANDOFF_ARTICLE,
	ACTIVE_CONTRACT_ARTICLE,
] as const;

export const ACTIVE_CONTRACT_ARTICLE_URL = absoluteUrl(ACTIVE_CONTRACT_ARTICLE.path);
export const CROSS_SESSION_HANDOFF_ARTICLE_URL = absoluteUrl(CROSS_SESSION_HANDOFF_ARTICLE.path);
