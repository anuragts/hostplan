import { CUSTOM_HTML_RESPONSE_HEADERS } from "@hostplan/core";
import { PLAN_REPRESENTATION_VARY } from "@/lib/plan-content-negotiation";
import { resolvePlanRouteAccess } from "@/lib/plan-route-access";

export const dynamic = "force-dynamic";

/**
 * Serves a plan's exact original bytes for source-negotiated plan URLs.
 * Access is shared with the rendered document route so neither can drift.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const access = await resolvePlanRouteAccess(request, id);
	if (!access.ok) return access.response;
	const { plan } = access;

	const contentType =
		plan.meta.format === "html" ? "text/html; charset=utf-8" : "text/markdown; charset=utf-8";

	return new Response(plan.body, {
		headers: {
			"content-type": contentType,
			...(plan.meta.format === "html" ? CUSTOM_HTML_RESPONSE_HEADERS : {}),
			"x-content-type-options": "nosniff",
			// Never let a shared or CDN cache hold a private plan.
			"cache-control": "private, no-store",
			vary: PLAN_REPRESENTATION_VARY,
		},
	});
}
