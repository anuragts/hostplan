import { origin } from "@/lib/origin";
import { clientKey, consumeAttempt } from "@/lib/rate-limit";
import { userClient } from "@/lib/supabase-clients";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
	const site = origin(request);
	// Sending mail on demand is abusable; the same limiter that guards share
	// codes guards this.
	if (!consumeAttempt(`magic:${clientKey(request)}`).allowed) {
		return Response.redirect(`${site}/login?error=too+many+attempts%2C+wait+a+minute`, 303);
	}

	const form = await request.formData();
	const email = String(form.get("email") ?? "").trim();
	const next = String(form.get("next") ?? "/");
	if (email.length === 0) return Response.redirect(`${site}/login?error=email+required`, 303);

	const supabase = await userClient();
	if (supabase === undefined)
		return Response.redirect(`${site}/login?error=accounts+are+not+configured`, 303);

	const { error } = await supabase.auth.signInWithOtp({
		email,
		options: { emailRedirectTo: `${site}/api/auth/callback?next=${encodeURIComponent(next)}` },
	});
	// Whether the address exists is not something an unauthenticated caller
	// should be able to probe, so a failure reads the same as a success.
	if (error !== null) return Response.redirect(`${site}/login?sent=1`, 303);
	return Response.redirect(`${site}/login?sent=1`, 303);
}
