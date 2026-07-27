import { type NextRequest, NextResponse } from "next/server";
import { wantsPlanSource } from "@/lib/plan-content-negotiation";

/**
 * Guards the index pages, which list plans and are therefore never anonymous.
 *
 * `/p/<id>` is handled here only to select source or viewer representation.
 * Whether it may be read depends on that plan's visibility and code, which
 * means loading it — so the access check stays in the page and raw route.
 *
 * Presence of a session cookie is all that is checked; the value is verified in
 * the page, since middleware runs on the edge. A forged cookie gets past this
 * and is rejected there.
 */
function hasSupabaseSession(request: NextRequest): boolean {
	// Supabase splits large sessions across `.0`/`.1` chunks, so match on shape.
	return request.cookies
		.getAll()
		.some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));
}

export function middleware(request: NextRequest) {
	const planMatch = request.nextUrl.pathname.match(/^\/p\/([^/]+)$/);
	if (planMatch?.[1] !== undefined) {
		if (wantsPlanSource(request.headers)) {
			// Keep the public URL and its query string (especially `?code=`), but
			// let the existing raw route load, authorise, and return the plan.
			const raw = request.nextUrl.clone();
			raw.pathname = `/api/raw/${planMatch[1]}`;
			return NextResponse.rewrite(raw);
		}
		return NextResponse.next();
	}

	// No accounts configured means running locally, where everything is open.
	if (process.env.HOSTPLAN_ACCOUNTS !== "1") return NextResponse.next();
	if (hasSupabaseSession(request)) return NextResponse.next();

	const login = new URL("/login", request.url);
	login.searchParams.set("next", request.nextUrl.pathname);
	return NextResponse.redirect(login);
}

export const config = {
	matcher: [
		"/p/:id",
		/*
		 * Everything except: the home page (serves a public landing page to
		 * visitors and the dashboard to a user, so it gates itself), the plan page
		 * (handled by the matcher above), API routes (gated per handler), login,
		 * and static assets.
		 *
		 * `login$` rather than `login` so a project named `login-flow` doesn't
		 * slip past the guard on the strength of its prefix.
		 */
		"/((?!$|p/|api/|login$|cli$|_next/|preview.png|favicon.ico|icon.svg|apple-icon.png).*)",
	],
};
