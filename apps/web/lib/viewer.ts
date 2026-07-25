import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Who is asking. Every store call is made on behalf of one of these.
 *
 * `legacy-owner` is the pre-accounts model: whoever holds HSP_TOKEN. It stays
 * so a single-user deployment never needs accounts, and so today's data and
 * today's CLI keep working through the migration.
 */
export type Viewer =
	| { kind: "user"; userId: string; email: string; db: SupabaseClient }
	| { kind: "legacy-owner" }
	| { kind: "anonymous" };

export function isSignedIn(viewer: Viewer): viewer is Extract<Viewer, { kind: "user" }> {
	return viewer.kind === "user";
}

/** True for anyone entitled to see a listing of plans, rather than one plan. */
export function canBrowse(viewer: Viewer): boolean {
	return viewer.kind === "user" || viewer.kind === "legacy-owner";
}

/** The account a newly written plan belongs to; undefined under the legacy owner. */
export function ownerId(viewer: Viewer): string | undefined {
	return viewer.kind === "user" ? viewer.userId : undefined;
}
