import { currentViewer, hashToken } from "@/lib/current-viewer";
import { origin } from "@/lib/origin";
import { newApiToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

/** Mint a personal access token — the path an agent uses, since it can't browse. */
export async function POST(request: Request) {
	const viewer = await currentViewer(request);
	const site = origin(request);
	if (viewer.kind !== "user")
		return Response.redirect(`${site}/login?next=%2Fsettings%2Ftokens`, 303);

	const form = await request.formData();
	const name = String(form.get("name") ?? "cli").slice(0, 40) || "cli";
	const token = newApiToken();

	const { error } = await viewer.db
		.from("api_tokens")
		.insert({ user_id: viewer.userId, name, token_hash: hashToken(token) });
	if (error !== null) return Response.redirect(`${site}/settings/tokens?error=1`, 303);

	// Shown once, in the URL fragment so it never reaches the server log.
	return Response.redirect(`${site}/settings/tokens?created=${encodeURIComponent(token)}`, 303);
}

export async function DELETE(request: Request) {
	const viewer = await currentViewer(request);
	if (viewer.kind !== "user") return Response.json({ error: "unauthorized" }, { status: 401 });
	const { id } = (await request.json().catch(() => ({}))) as { id?: string };
	if (typeof id !== "string") return Response.json({ error: "id required" }, { status: 400 });
	// RLS restricts this to the caller's own rows.
	const { error } = await viewer.db.from("api_tokens").delete().eq("id", id);
	if (error !== null) return Response.json({ error: error.message }, { status: 500 });
	return Response.json({ revoked: id });
}
