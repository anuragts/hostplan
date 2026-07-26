import { createHash } from "node:crypto";
import { cache } from "react";
import { accountsEnabled, adminClient, userClient } from "@/lib/supabase-clients";
import type { Viewer } from "@/lib/viewer";

/** Tokens are stored as a digest, so this is how a bearer becomes a lookup key. */
export function hashToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

function bearer(request: Request): string | undefined {
	const header = request.headers.get("authorization");
	if (header === null || !header.toLowerCase().startsWith("bearer ")) return undefined;
	const value = header.slice(7).trim();
	return value.length > 0 ? value : undefined;
}

/**
 * Resolves a CLI token to its account.
 *
 * Uses the admin client because the caller has no session yet — the token *is*
 * the credential being checked, so there is nothing for RLS to filter on. The
 * store handed back afterwards is scoped to the user this resolves to.
 */
async function viewerFromToken(token: string): Promise<Viewer | undefined> {
	const admin = adminClient();
	const { data } = await admin
		.from("api_tokens")
		.select("user_id")
		.eq("token_hash", hashToken(token))
		.maybeSingle();
	const userId = (data as { user_id: string } | null)?.user_id;
	if (userId === undefined) return undefined;

	const { data: user } = await admin.auth.admin.getUserById(userId);
	if (user.user === null) return undefined;

	// Best-effort: a failed timestamp write shouldn't fail the request.
	void admin
		.from("api_tokens")
		.update({ last_used_at: new Date().toISOString() })
		.eq("token_hash", hashToken(token));

	return { kind: "user", userId, email: user.user.email ?? "", db: admin };
}

/**
 * Who is making this request: a CLI token, then a browser session, then nobody.
 *
 * With no accounts configured this is the local viewer, which is how `hsp serve`
 * stays frictionless on localhost.
 *
 * Memoised per request by `cache()`: a page and its `generateMetadata` both need
 * the viewer, and resolving one costs a round trip to the auth server. Keyed on
 * the argument, so a route handler passing its own `Request` is unaffected.
 */
export const currentViewer = cache(async function currentViewer(
	request?: Request,
): Promise<Viewer> {
	if (!accountsEnabled()) return { kind: "local" };

	const token = request === undefined ? undefined : bearer(request);
	if (token !== undefined) {
		const viewer = await viewerFromToken(token);
		if (viewer !== undefined) return viewer;
		// An unrecognised bearer is simply not signed in.
	}

	const supabase = await userClient();
	const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
	if (data.user !== null && supabase !== undefined) {
		return { kind: "user", userId: data.user.id, email: data.user.email ?? "", db: supabase };
	}

	return { kind: "anonymous" };
});

export function unauthorized(): Response {
	return Response.json({ error: "unauthorized" }, { status: 401 });
}
