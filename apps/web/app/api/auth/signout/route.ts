import { origin } from "@/lib/origin";
import { userClient } from "@/lib/supabase-clients";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
	const supabase = await userClient();
	await supabase?.auth.signOut();
	return Response.redirect(`${origin(request)}/`, 303);
}
