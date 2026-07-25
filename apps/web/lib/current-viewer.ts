import { createHash } from "node:crypto";
import { authEnabled, hasOwnerBearer, isOwnerSession } from "@/lib/auth";
import { accountsEnabled, adminClient, userClient } from "@/lib/supabase-clients";
import type { Viewer } from "@/lib/viewer";

const ANON: Viewer = { kind: "anonymous" };

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
 * store handed back afterwards is still scoped to the user this resolves to.
 */
async function viewerFromToken(token: string): Promise<Viewer | undefined> {
	if (!accountsEnabled()) return undefined;
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

	return {
		kind: "user",
		userId,
		email: user.user.email ?? "",
		// Service-role client scoped by us to this user. RLS is off on this path,
		// which is why every query the store makes still filters by user_id.
		db: admin,
	};
}

/**
 * Who is making this request, in precedence order: a CLI token, then a browser
 * session, then the legacy single-owner token, then nobody.
 */
export async function currentViewer(request?: Request): Promise<Viewer> {
	const token = request === undefined ? undefined : bearer(request);

	if (token !== undefined) {
		const viewer = await viewerFromToken(token);
		if (viewer !== undefined) return viewer;
		// Falls through: the token may be the legacy HSP_TOKEN rather than a PAT.
	}

	if (accountsEnabled()) {
		const supabase = await userClient();
		const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
		if (data.user !== null && supabase !== undefined) {
			return { kind: "user", userId: data.user.id, email: data.user.email ?? "", db: supabase };
		}
	}

	if (authEnabled()) {
		const owner =
			request !== undefined
				? hasOwnerBearer(request) || (await isOwnerSession())
				: await isOwnerSession();
		if (owner) return { kind: "legacy-owner" };
		return ANON;
	}

	// No auth configured at all: the local viewer, where everyone is the owner.
	return { kind: "legacy-owner" };
}
