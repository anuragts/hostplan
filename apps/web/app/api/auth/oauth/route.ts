import { origin } from "@/lib/origin";
import { userClient } from "@/lib/supabase-clients";

export const dynamic = "force-dynamic";

/** Starts the GitHub flow. A POST so it can't be triggered by a stray link. */
export async function POST(request: Request) {
	const form = await request.formData();
	const next = String(form.get("next") ?? "/");
	const supabase = await userClient();
	if (supabase === undefined)
		return Response.redirect(`${origin(request)}/login?error=accounts+are+not+configured`, 303);

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "github",
		options: {
			redirectTo: `${origin(request)}/api/auth/callback?next=${encodeURIComponent(next)}`,
		},
	});
	if (error !== null || data.url === null) {
		return Response.redirect(
			`${origin(request)}/login?error=${encodeURIComponent(error?.message ?? "could not start sign-in")}`,
			303,
		);
	}
	return Response.redirect(data.url, 303);
}
