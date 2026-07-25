import { origin } from "@/lib/origin";
import { clientKey, consumeAttempt } from "@/lib/rate-limit";
import { accountsEnabled, adminClient } from "@/lib/supabase-clients";
import { newDeviceCode, newUserCode } from "@/lib/tokens";

export const dynamic = "force-dynamic";

/** Step one of `hsp login`: mint a pending request for the human to approve. */
export async function POST(request: Request) {
	if (!accountsEnabled()) {
		return Response.json({ error: "accounts are not enabled on this deployment" }, { status: 400 });
	}
	if (!consumeAttempt(`cli-auth:${clientKey(request)}`).allowed) {
		return Response.json({ error: "too many attempts" }, { status: 429 });
	}

	const deviceCode = newDeviceCode();
	const userCode = newUserCode();
	const { error } = await adminClient()
		.from("cli_auth_requests")
		.insert({ device_code: deviceCode, user_code: userCode });
	if (error !== null) return Response.json({ error: error.message }, { status: 500 });

	return Response.json({
		device_code: deviceCode,
		user_code: userCode,
		verify_url: `${origin(request)}/cli`,
		interval: 2,
		expires_in: 600,
	});
}
