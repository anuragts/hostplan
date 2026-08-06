import { CUSTOM_HTML_RESPONSE_HEADERS, renderCustomHtml } from "@hostplan/core";
import { resolvePlanRouteAccess } from "@/lib/plan-route-access";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const access = await resolvePlanRouteAccess(request, id, "html");
	if (!access.ok) return access.response;

	return new Response(renderCustomHtml(access.plan.body), {
		headers: {
			"content-type": "text/html; charset=utf-8",
			...CUSTOM_HTML_RESPONSE_HEADERS,
			"cache-control": "private, no-store",
		},
	});
}
