import { currentViewer } from "@/lib/current-viewer";
import { origin } from "@/lib/origin";
import { adminClient } from "@/lib/supabase-clients";

export const dynamic = "force-dynamic";

/** The human's half: attach their account to a pending CLI request. */
export async function POST(request: Request) {
	const viewer = await currentViewer(request);
	const site = origin(request);
	if (viewer.kind !== "user") {
		return Response.redirect(`${site}/login?next=%2Fcli`, 303);
	}

	const form = await request.formData();
	const userCode = String(form.get("user_code") ?? "")
		.trim()
		.toUpperCase();
	if (userCode.length === 0) return Response.redirect(`${site}/cli?error=1`, 303);

	const { data, error } = await adminClient()
		.from("cli_auth_requests")
		.update({ user_id: viewer.userId, approved_at: new Date().toISOString() })
		.eq("user_code", userCode)
		.is("approved_at", null)
		.gt("expires_at", new Date().toISOString())
		.select("user_code");

	if (error !== null || (data as unknown[]).length === 0) {
		return Response.redirect(`${site}/cli?error=1`, 303);
	}
	return Response.redirect(`${site}/cli?ok=1`, 303);
}
