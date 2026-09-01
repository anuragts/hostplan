import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { authEnabled, ownerToken, SESSION_COOKIE, SESSION_MAX_AGE, sessionValue } from "@/lib/auth";
import { clientKey, consumeAttempt } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Exchanges the single-owner deployment token for an HttpOnly session. */
export async function POST(request: Request) {
	if (!authEnabled()) {
		return Response.json({ error: "no owner token configured" }, { status: 400 });
	}

	const limit = consumeAttempt(`login:${clientKey(request)}`);
	if (!limit.allowed) {
		return Response.json(
			{ error: "too many attempts" },
			{ status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } },
		);
	}

	const form = await request.formData();
	const supplied = String(form.get("token") ?? "");
	const token = ownerToken() ?? "";
	const suppliedDigest = createHmac("sha256", "compare").update(supplied).digest();
	const tokenDigest = createHmac("sha256", "compare").update(token).digest();
	if (!timingSafeEqual(suppliedDigest, tokenDigest)) {
		return Response.redirect(new URL("/login?error=1", request.url), 303);
	}

	(await cookies()).set(SESSION_COOKIE, sessionValue(token), {
		httpOnly: true,
		sameSite: "lax",
		secure:
			(request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.slice(0, -1)) ===
			"https",
		path: "/",
		maxAge: SESSION_MAX_AGE,
	});

	const target = String(form.get("next") ?? "/");
	const safe = target.startsWith("/") && !target.startsWith("//") ? target : "/";
	return Response.redirect(new URL(safe, request.url), 303);
}

export async function DELETE() {
	(await cookies()).delete(SESSION_COOKIE);
	return Response.json({ ok: true });
}
