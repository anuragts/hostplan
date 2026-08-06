export type AcquisitionSource =
	| "chatgpt"
	| "perplexity"
	| "google"
	| "bing"
	| "github"
	| "other-referral"
	| "direct";

const SAFE_PUBLIC_PATHS = new Set([
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
	"/examples/custom-html",
	"/examples/plan-lifecycle",
	"/examples/plan-stack",
	"/examples/agent-handoff",
	"/compare/plan-md-vs-hostplan",
	"/about",
	"/login",
]);

/** Prevent plan ids, project names, branches, and account routes entering analytics. */
export function analyticsPath(pathname: string): string {
	if (/^\/p\/[^/]+$/.test(pathname)) return "/p/:id";
	if (SAFE_PUBLIC_PATHS.has(pathname)) return pathname;
	return "/private";
}

export function sanitizedAnalyticsProperties(
	properties: Record<string, unknown>,
	origin: string,
	pathname: string,
): Record<string, unknown> {
	const safePath = analyticsPath(pathname);
	const sanitized: Record<string, unknown> = {
		...properties,
		$current_url: `${origin}${safePath}`,
		$pathname: safePath,
	};
	for (const key of [
		"$referrer",
		"$referring_domain",
		"$initial_referrer",
		"$initial_referring_domain",
		"$initial_current_url",
	]) {
		delete sanitized[key];
	}
	return sanitized;
}

/** Coarse acquisition labels only; never persist a full referrer URL or query. */
export function acquisitionSource(referrer: string, utmSource?: string): AcquisitionSource {
	const source = utmSource?.trim().toLowerCase();
	if (source?.includes("chatgpt")) return "chatgpt";
	if (source?.includes("perplexity")) return "perplexity";
	if (source?.includes("google")) return "google";
	if (source?.includes("bing") || source?.includes("copilot")) return "bing";
	if (source?.includes("github")) return "github";

	if (referrer.length === 0) return "direct";

	try {
		const host = new URL(referrer).hostname.toLowerCase();
		if (host === "chatgpt.com" || host.endsWith(".chatgpt.com")) return "chatgpt";
		if (host === "perplexity.ai" || host.endsWith(".perplexity.ai")) return "perplexity";
		if (host.includes("google.")) return "google";
		if (host === "bing.com" || host.endsWith(".bing.com") || host.includes("copilot"))
			return "bing";
		if (host === "github.com" || host.endsWith(".github.com")) return "github";
		return "other-referral";
	} catch {
		return "other-referral";
	}
}
