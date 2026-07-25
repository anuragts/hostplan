import { canRead, isId, normalizeCode } from "@hostplan/core";
import { currentViewer } from "@/lib/current-viewer";
import { clientKey, codeAttemptKey, consumeAttempt } from "@/lib/rate-limit";
import { adminPlanStore } from "@/lib/store";
import { canBrowse } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/**
 * Serves a plan's original bytes — the source for the HTML iframe. This is the
 * route that would quietly undo the whole scheme if it skipped the check, so it
 * runs the same canRead() as the page.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const plan = isId(id) ? await adminPlanStore().get(id) : undefined;
	if (plan === undefined) return new Response("not found", { status: 404 });

	const code = normalizeCode(new URL(request.url).searchParams.get("code"));
	const isOwner = canBrowse(await currentViewer(request));

	if (!canRead(plan.meta, { isOwner, code })) {
		if (!isOwner) {
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
		},
	});
}
