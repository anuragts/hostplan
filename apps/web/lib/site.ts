import type { Metadata } from "next";

export const SITE_URL = "https://plans.host-plan.com";
export const SITE_NAME = "Hostplan";
export const SITE_DESCRIPTION =
	"Store, share, resume, and hand off coding-agent plans with stable, machine-readable URLs.";
export const REPOSITORY_URL = "https://github.com/anuragts/hostplan";
export const SITE_UPDATED = "2026-07-28";

export const HOME_JSON_LD = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "Organization",
			"@id": `${SITE_URL}/#organization`,
			name: "Hostplan project",
			url: SITE_URL,
			logo: `${SITE_URL}/icon.svg`,
			sameAs: [REPOSITORY_URL],
		},
		{
			"@type": "WebSite",
			"@id": `${SITE_URL}/#website`,
			name: "Hostplan",
			url: SITE_URL,
			description:
				"A local-first home for storing, sharing, resuming, and handing off coding-agent plans.",
			publisher: { "@id": `${SITE_URL}/#organization` },
		},
		{
			"@type": "SoftwareApplication",
			"@id": `${SITE_URL}/#software`,
			name: "Hostplan",
			applicationCategory: "DeveloperApplication",
			isAccessibleForFree: true,
			description:
				"An open-source CLI and web viewer that gives coding-agent plans stable, shareable, machine-readable URLs.",
			url: SITE_URL,
			codeRepository: REPOSITORY_URL,
			license: "https://opensource.org/license/mit",
			author: { "@id": `${SITE_URL}/#organization` },
		},
	],
} as const;

export const PUBLIC_ROUTES = [
	"/",
	"/coding-agent-plans",
	"/share-coding-agent-plans",
	"/agent-plan-handoff",
	"/integrations/codex",
	"/integrations/claude-code",
	"/integrations/cursor",
	"/docs/cli",
	"/docs/agent-setup",
	"/examples",
	"/examples/plan-lifecycle",
	"/examples/plan-stack",
	"/examples/agent-handoff",
	"/compare/plan-md-vs-hostplan",
	"/about",
] as const;

export function absoluteUrl(path: string): string {
	return new URL(path, SITE_URL).toString();
}

export function pageMetadata({
	title,
	description,
	path,
}: {
	title: string;
	description: string;
	path: string;
}): Metadata {
	const canonical = absoluteUrl(path);
	return {
		title,
		description,
		alternates: { canonical },
		openGraph: {
			type: "article",
			url: canonical,
			siteName: SITE_NAME,
			title,
			description,
			images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${title} · Hostplan` }],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: ["/opengraph-image"],
		},
	};
}
