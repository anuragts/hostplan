import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export function supabaseUrl(): string | undefined {
	return process.env.SUPABASE_URL;
}

export function publishableKey(): string | undefined {
	return process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
}

export function secretKey(): string | undefined {
	return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function accountsEnabled(): boolean {
	return supabaseUrl() !== undefined && publishableKey() !== undefined;
}

/**
 * Bound to the signed-in user's session, so every query it makes is filtered by
 * row-level security. This is the client almost everything should use: if a
 * route handler asks for a plan it shouldn't see, Postgres — not my code —
 * refuses.
 */
export async function userClient(): Promise<SupabaseClient | undefined> {
	const url = supabaseUrl();
	const key = publishableKey();
	if (url === undefined || key === undefined) return undefined;

	const jar = await cookies();
	return createServerClient(url, key, {
		cookies: {
			getAll: () => jar.getAll(),
			setAll: (items) => {
				try {
					for (const { name, value, options } of items) jar.set(name, value, options);
				} catch {
					// Called from a server component, where cookies are read-only. The
					// middleware refreshes the session instead, so this is safe to skip.
				}
			},
		},
	});
}

/**
 * Bypasses row-level security entirely. Used for exactly two things: reading a
 * private plan for someone holding its share code (a rule RLS cannot express),
 * and resolving a CLI bearer token to its owner. Nothing else should reach for
 * this.
 */
export function adminClient(): SupabaseClient {
	const url = supabaseUrl();
	const key = secretKey();
	if (url === undefined || key === undefined) {
		throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY are required");
	}
	return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
