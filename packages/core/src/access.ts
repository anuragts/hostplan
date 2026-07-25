import { codesMatch } from "./code";
import type { PlanMeta } from "./meta";

export type Visibility = "public" | "private";

export interface ReadContext {
	/** True when the request carries the owner token or a valid session cookie. */
	isOwner?: boolean;
	/** Code supplied on the query string or the unlock form. */
	code?: string | undefined;
}

/**
 * The single gate for reading a plan. Every surface that can return plan
 * content — the page, the raw route, the API — goes through this. Protecting
 * the page and forgetting the raw route is the classic hole in schemes like
 * this, so there is exactly one implementation.
 */
export function canRead(meta: PlanMeta, context: ReadContext = {}): boolean {
	if (meta.visibility === "public") return true;
	if (context.isOwner === true) return true;
	return codesMatch(meta.code, context.code);
}

/** Both share forms for a plan: the bare link, and the one that walks straight in. */
export function shareUrls(origin: string, meta: PlanMeta): { url: string; codedUrl?: string } {
	const url = `${origin.replace(/\/$/, "")}/p/${meta.id}`;
	if (meta.visibility === "public" || meta.code === undefined) return { url };
	return { url, codedUrl: `${url}?code=${meta.code}` };
}
