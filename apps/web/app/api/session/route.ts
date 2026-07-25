import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { authEnabled, ownerToken, SESSION_COOKIE, SESSION_MAX_AGE, sessionValue } from "@/lib/auth";
import { clientKey, consumeAttempt } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Exchanges the owner token for a session cookie. */
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

	const a = createHmac("sha256", "compare").update(supplied).digest();
	const b = createHmac("sha256", "compare").update(token).digest();
	if (!timingSafeEqual(a, b)) {
		const next = new URL("/login?error=1", request.url);
		return Response.redirect(next, 303);
	}

	const jar = await cookies();
	jar.set(SESSION_COOKIE, sessionValue(token), {
		httpOnly: true,
		sameSite: "lax",
		secure: new URL(request.url).protocol === "https:",
		path: "/",
		maxAge: SESSION_MAX_AGE,
	});

	const target = String(form.get("next") ?? "/");
	// Only ever bounce back to a path on this site.
	const safe = target.startsWith("/") && !target.startsWith("//") ? target : "/";
	return Response.redirect(new URL(safe, request.url), 303);
}

export async function DELETE() {
	(await cookies()).delete(SESSION_COOKIE);
	return Response.json({ ok: true });
}
