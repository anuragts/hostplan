import { createHash } from "node:crypto";
import type { Viewer } from "./viewer";

const TRUSTED_HTML_MARKER = "<!--hostplan-trusted-html-v1-->";

// Store hashes instead of publishing account email addresses in source.
const TRUSTED_PUBLISHER_EMAIL_HASHES = new Set([
	"b9b4c798841909cace79c18763170a1a41dca658285c0588fd943653a437c4b6",
]);

function emailHash(email: string): string {
	return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export function canPublishTrustedHtml(viewer: Viewer): boolean {
	if (viewer.kind === "local") return true;
	return viewer.kind === "user" && TRUSTED_PUBLISHER_EMAIL_HASHES.has(emailHash(viewer.email));
}

export function isTrustedHtml(source: string): boolean {
	return source.includes(TRUSTED_HTML_MARKER);
}

export function stripTrustedHtmlMarker(source: string): string {
	return source.replace(`${TRUSTED_HTML_MARKER}\n`, "").replace(TRUSTED_HTML_MARKER, "");
}

export function markTrustedHtml(source: string): string {
	const clean = stripTrustedHtmlMarker(source);
	const doctype = clean.match(/^\s*<!doctype\s+html\s*>/i)?.[0];
	if (doctype === undefined) return `${TRUSTED_HTML_MARKER}\n${clean}`;
	return clean.replace(doctype, `${doctype}\n${TRUSTED_HTML_MARKER}`);
}
