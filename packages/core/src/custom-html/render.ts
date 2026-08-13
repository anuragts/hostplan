import { CUSTOM_HTML_COMPONENT_CSS } from "./components";
import { CUSTOM_HTML_PROFILE } from "./profile";

export const CUSTOM_HTML_RESPONSE_HEADERS = {
	"content-security-policy": [
		"sandbox",
		"default-src 'none'",
		"style-src 'unsafe-inline'",
		"script-src 'none'",
		"connect-src 'none'",
		"img-src 'none'",
		"font-src 'none'",
		"frame-src 'none'",
		"object-src 'none'",
		"form-action 'none'",
		"base-uri 'none'",
		"navigate-to 'none'",
	].join("; "),
	"referrer-policy": "no-referrer",
	"x-content-type-options": "nosniff",
} as const;

/**
 * Trusted documents still run in an opaque-origin iframe, but may execute
 * scripts and load public HTTPS assets. This policy is selected only after the
 * hosted API has authenticated an allowlisted publisher and marked the stored
 * plan as trusted.
 */
export const TRUSTED_HTML_RESPONSE_HEADERS = {
	"content-security-policy": [
		"sandbox allow-scripts allow-popups",
		"default-src 'none'",
		"style-src 'unsafe-inline' https:",
		"script-src 'unsafe-inline' https:",
		"connect-src https:",
		"img-src https: data: blob:",
		"font-src https: data:",
		"media-src https: data: blob:",
		"worker-src blob:",
		"frame-src 'none'",
		"object-src 'none'",
		"form-action 'none'",
		"base-uri 'none'",
		"navigate-to https:",
	].join("; "),
	"referrer-policy": "no-referrer",
	"x-content-type-options": "nosniff",
} as const;

export function hasCustomHtmlProfile(source: string): boolean {
	return (source.match(/<meta\b[^>]*>/gi) ?? []).some(
		(tag) =>
			/\bname=["']hostplan-profile["']/i.test(tag) &&
			new RegExp(`\\bcontent=["']${CUSTOM_HTML_PROFILE}["']`, "i").test(tag),
	);
}

/** Inject only into the rendered copy. `/api/raw` always returns exact source. */
export function renderCustomHtml(source: string): string {
	if (!hasCustomHtmlProfile(source)) return source;
	const componentStyle = `<style data-hostplan-components="${CUSTOM_HTML_PROFILE}">${CUSTOM_HTML_COMPONENT_CSS}</style>`;
	return source.replace(/<head(?:\s[^>]*)?>/i, (head) => `${head}\n${componentStyle}`);
}
