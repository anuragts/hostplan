import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "./session-cookie";

export { SESSION_COOKIE, SESSION_MAX_AGE };

/**
 * Auth only exists when an owner token is configured. Running locally there is
 * no token, so the viewer behaves exactly as it always has: no login, no codes.
 */
export function ownerToken(): string | undefined {
	const token = process.env.HSP_TOKEN;
	return token !== undefined && token.length > 0 ? token : undefined;
}

export function authEnabled(): boolean {
	return ownerToken() !== undefined;
}

/**
 * Locally there is no token and everyone is the owner — that's what makes
 * `hsp serve` on localhost frictionless. Against a real bucket that same
 * fallback would hand the whole store, writes included, to anyone who found
 * the URL. Setting SUPABASE_URL without HSP_TOKEN is never intentional, so it
 * fails loudly on every request instead of silently serving.
 *
 * Read from the environment directly rather than through lib/store to keep
 * this free of an import cycle.
 */
function assertAuthConfigured(): void {
	if (!authEnabled() && process.env.SUPABASE_URL !== undefined) {
		throw new Error(
			"HSP_TOKEN is required when SUPABASE_URL is set: refusing to serve a remote store with auth disabled",
		);
	}
}

function equals(a: string, b: string): boolean {
	const left = Buffer.from(a);
	const right = Buffer.from(b);
	if (left.length !== right.length) return false;
	return timingSafeEqual(left, right);
}

/**
 * The session cookie is an HMAC of a fixed label under the owner token, so
 * rotating the token invalidates every cookie without storing any sessions.
 */
export function sessionValue(token: string): string {
	return createHmac("sha256", token).update("hostplan-owner-session").digest("hex");
}

export function isValidSession(value: string | undefined): boolean {
	const token = ownerToken();
	if (token === undefined || value === undefined) return false;
	return equals(value, sessionValue(token));
}

/** Bearer token on the request — how the CLI authenticates. */
export function hasOwnerBearer(request: Request): boolean {
	const token = ownerToken();
	if (token === undefined) return false;
	const header = request.headers.get("authorization");
	if (header === null || !header.startsWith("Bearer ")) return false;
	return equals(header.slice(7).trim(), token);
}

/** Owner check for route handlers: bearer header or session cookie. */
export async function isOwnerRequest(request: Request): Promise<boolean> {
	assertAuthConfigured();
	if (!authEnabled()) return true;
	if (hasOwnerBearer(request)) return true;
	return isValidSession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Owner check for server components, which have no Request in scope. */
export async function isOwnerSession(): Promise<boolean> {
	assertAuthConfigured();
	if (!authEnabled()) return true;
	return isValidSession((await cookies()).get(SESSION_COOKIE)?.value);
}

export function unauthorized(): Response {
	return Response.json({ error: "unauthorized" }, { status: 401 });
}
