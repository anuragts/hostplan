import { canRead, isId, normalizeCode } from "@hostplan/core";
import { currentViewer } from "@/lib/current-viewer";
import { ownsPlan } from "@/lib/plan-access";
import { PLAN_REPRESENTATION_VARY } from "@/lib/plan-content-negotiation";
import { clientKey, codeAttemptKey, consumeAttempt } from "@/lib/rate-limit";
import { adminPlanStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Serves a plan's original bytes — both for HTML iframes and source-negotiated
 * plan URLs. This route would quietly undo the whole access scheme if it
 * skipped the check, so it runs the same canRead() as the page.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const plan = isId(id) ? await adminPlanStore().get(id) : undefined;
	if (plan === undefined) return new Response("not found", { status: 404 });

	const supplied = new URL(request.url).searchParams.get("code");
	const code = normalizeCode(supplied);
	const isOwner = ownsPlan(plan, await currentViewer(request));

	if (!canRead(plan.meta, { isOwner, code })) {
		// Opening a bare private link is not a guess. Count only a supplied code,
		// matching the page's code gate.
		if (!isOwner && supplied !== null && supplied.length > 0) {
			const limit = consumeAttempt(codeAttemptKey(clientKey(request)));
			if (!limit.allowed) {
				return new Response("too many attempts", {
					status: 429,
					headers: { "retry-after": String(limit.retryAfterSeconds) },
				});
			}
		}
		return new Response("not found", { status: 404 });
	}

	const contentType =
		plan.meta.format === "html" ? "text/html; charset=utf-8" : "text/markdown; charset=utf-8";

	return new Response(plan.body, {
		headers: {
			"content-type": contentType,
			// Belt and braces alongside the iframe's sandbox attribute.
			"content-security-policy": "sandbox; default-src 'none'; style-src 'unsafe-inline'",
			"x-content-type-options": "nosniff",
			// Never let a shared or CDN cache hold a private plan.
			"cache-control": "private, no-store",
			vary: PLAN_REPRESENTATION_VARY,
		},
	});
}
