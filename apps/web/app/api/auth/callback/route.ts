import { origin } from "@/lib/origin";
import { userClient } from "@/lib/supabase-clients";

export const dynamic = "force-dynamic";

/** Where both GitHub and the magic link land; exchanges the code for a session. */
export async function GET(request: Request) {
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const next = url.searchParams.get("next") ?? "/";
	const site = origin(request);

	if (code === null) return Response.redirect(`${site}/login?error=sign-in+was+cancelled`, 303);

	const supabase = await userClient();
	if (supabase === undefined)
		return Response.redirect(`${site}/login?error=accounts+are+not+configured`, 303);

	const { error } = await supabase.auth.exchangeCodeForSession(code);
	if (error !== null) {
		return Response.redirect(`${site}/login?error=${encodeURIComponent(error.message)}`, 303);
	}
	// Relative `next` only — an open redirect here would hand sessions to any
	// site that could get someone to click a link.
	const target = next.startsWith("/") && !next.startsWith("//") ? next : "/";
	return Response.redirect(`${site}${target}`, 303);
}
