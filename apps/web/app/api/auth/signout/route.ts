import { cookies } from "next/headers";
import { origin } from "@/lib/origin";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { userClient } from "@/lib/supabase-clients";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
	const supabase = await userClient();
	await supabase?.auth.signOut();
	(await cookies()).delete(SESSION_COOKIE);
	return Response.redirect(`${origin(request)}/`, 303);
}
