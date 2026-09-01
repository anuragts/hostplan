import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "./session-cookie";

export { SESSION_COOKIE, SESSION_MAX_AGE };

export function ownerToken(): string | undefined {
	const token = process.env.HSP_TOKEN;
	return token !== undefined && token.length > 0 ? token : undefined;
}

export function authEnabled(): boolean {
	return ownerToken() !== undefined;
}

function equals(a: string, b: string): boolean {
	const left = Buffer.from(a);
	const right = Buffer.from(b);
	return left.length === right.length && timingSafeEqual(left, right);
}

/** Rotating HSP_TOKEN invalidates every browser session without server state. */
export function sessionValue(token: string): string {
	return createHmac("sha256", token).update("hostplan-owner-session").digest("hex");
}

export function isValidSession(value: string | undefined): boolean {
	const token = ownerToken();
	return token !== undefined && value !== undefined && equals(value, sessionValue(token));
}

export function hasOwnerBearer(request: Request): boolean {
	const token = ownerToken();
	if (token === undefined) return false;
	const header = request.headers.get("authorization");
	if (header === null || !header.toLowerCase().startsWith("bearer ")) return false;
	return equals(header.slice(7).trim(), token);
}

export async function isOwnerRequest(request: Request): Promise<boolean> {
	if (hasOwnerBearer(request)) return true;
	return isValidSession((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function isOwnerSession(): Promise<boolean> {
	return isValidSession((await cookies()).get(SESSION_COOKIE)?.value);
}
