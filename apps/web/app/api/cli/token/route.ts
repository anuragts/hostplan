import { hashToken } from "@/lib/current-viewer";
import { accountsEnabled, adminClient } from "@/lib/supabase-clients";
import { newApiToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

/**
 * Step two: the CLI polls here. Returns `pending` until a human approves, then
 * mints a token exactly once and burns the request so a replayed poll gets
 * nothing.
 */
export async function POST(request: Request) {
	if (!accountsEnabled()) {
		return Response.json({ error: "accounts are not enabled" }, { status: 400 });
	}
	const body = (await request.json().catch(() => ({}))) as { device_code?: string };
	const deviceCode = body.device_code;
	if (typeof deviceCode !== "string") {
		return Response.json({ error: "device_code required" }, { status: 400 });
	}

	const admin = adminClient();
	const { data } = await admin
		.from("cli_auth_requests")
		.select("user_id, approved_at, expires_at")
		.eq("device_code", deviceCode)
		.maybeSingle();
	const row = data as {
		user_id: string | null;
		approved_at: string | null;
		expires_at: string;
	} | null;

	if (row === null) return Response.json({ error: "unknown device code" }, { status: 404 });
	if (new Date(row.expires_at) < new Date()) {
		return Response.json({ error: "expired — run `hsp login` again" }, { status: 410 });
	}
	if (row.approved_at === null || row.user_id === null) {
		return Response.json({ status: "pending" }, { status: 202 });
	}

	const token = newApiToken();
	const { error } = await admin
		.from("api_tokens")
		.insert({ user_id: row.user_id, name: "cli", token_hash: hashToken(token) });
	if (error !== null) return Response.json({ error: error.message }, { status: 500 });

	// One approval, one token.
	await admin.from("cli_auth_requests").delete().eq("device_code", deviceCode);

	const { data: user } = await admin.auth.admin.getUserById(row.user_id);
	return Response.json({ token, email: user.user?.email ?? null });
}
