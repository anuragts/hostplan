import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Who is asking.
 *
 * `local` is the viewer when no accounts are configured — the `hsp serve`
 * case on localhost, where the store is a folder on your own machine and there
 * is nobody to authenticate against. A deployment always configures accounts,
 * so it never sees this.
 */
export type Viewer =
	| { kind: "user"; userId: string; email: string; db: SupabaseClient }
	| { kind: "local" }
	| { kind: "anonymous" };

export function isSignedIn(viewer: Viewer): viewer is Extract<Viewer, { kind: "user" }> {
	return viewer.kind === "user";
}

/** Entitled to see a listing of plans, rather than one plan by link. */
export function canBrowse(viewer: Viewer): boolean {
	return viewer.kind === "user" || viewer.kind === "local";
}

/** The account a newly written plan belongs to; undefined running locally. */
export function ownerId(viewer: Viewer): string | undefined {
	return viewer.kind === "user" ? viewer.userId : undefined;
}
