import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

/**
 * Guards the index pages, which list everything and are therefore owner-only
 * even when individual plans are public.
 *
 * `/p/<id>` is deliberately not handled here: whether it may be read depends on
 * that plan's visibility and code, which means loading it — so the check lives
 * in the page and the raw route, both of which call canRead().
 *
 * This only verifies that a session cookie is *present*; the value is verified
 * in the page, since middleware runs on the edge without the owner token's
 * crypto. A forged cookie gets past this and is rejected there.
 */
/**
 * Supabase stores its session in `sb-<ref>-auth-token`, sometimes split across
 * `.0`/`.1` chunks. Presence is all we check here — the value is verified in
 * the page, same as the legacy cookie.
 */
function hasSupabaseSession(request: NextRequest): boolean {
	return request.cookies
		.getAll()
		.some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));
}

export function middleware(request: NextRequest) {
	const accounts = process.env.HOSTPLAN_ACCOUNTS === "1";
	const token = process.env.HSP_TOKEN;

	// Nothing configured means running locally: as open as it has always been.
	if (!accounts && (token === undefined || token.length === 0)) return NextResponse.next();

	// Either credential counts. Checking only the legacy cookie sent anyone who
	// signed in with a magic link into a loop: middleware bounced them to
	// /login, which saw a valid session and bounced them straight back.
	if (request.cookies.get(SESSION_COOKIE) !== undefined) return NextResponse.next();
	if (accounts && hasSupabaseSession(request)) return NextResponse.next();

	const login = new URL("/login", request.url);
	login.searchParams.set("next", request.nextUrl.pathname);
	return NextResponse.redirect(login);
}

export const config = {
	matcher: [
		/*
		 * Everything except: the home page (serves a public landing page to
		 * visitors and the index to the owner, so it gates itself), the plan page
		 * (self-gating), API routes (gated per handler), login, and static assets.
		 *
		 * `login$` rather than `login` so a project named `login-flow` doesn't
		 * slip past the guard on the strength of its prefix.
		 */
		"/((?!$|p/|api/|login$|_next/|preview.png|favicon.ico|icon.svg|apple-icon.png).*)",
	],
};
