import { absoluteUrl, DAILY_SUNRISE_PATH } from "@/lib/site";

export const DAILY_SUNRISE_ARTICLE = {
	slug: "2026-08-13-active-contract-ledger",
	path: DAILY_SUNRISE_PATH,
	title: "Use an active-contract ledger to resume coding-agent work safely",
	shortTitle: "Active-contract ledger",
	description:
		"A practical plan format for resuming long-running coding-agent work without losing scope, authority, progress, or verification evidence.",
	published: "2026-08-13",
	updated: "2026-08-13",
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

export const DAILY_SUNRISE_ARTICLE_URL = absoluteUrl(DAILY_SUNRISE_ARTICLE.path);
