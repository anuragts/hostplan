import {
	CUSTOM_HTML_RESPONSE_HEADERS,
	renderCustomHtml,
	TRUSTED_HTML_RESPONSE_HEADERS,
} from "@hostplan/core";
import { resolvePlanRouteAccess } from "@/lib/plan-route-access";
import { isTrustedHtml, stripTrustedHtmlMarker } from "@/lib/trusted-html";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const access = await resolvePlanRouteAccess(request, id, "html");
	if (!access.ok) return access.response;

	const trusted = isTrustedHtml(access.plan.body);
	const source = stripTrustedHtmlMarker(access.plan.body);
	return new Response(renderCustomHtml(source), {
		headers: {
			"content-type": "text/html; charset=utf-8",
			...(trusted ? TRUSTED_HTML_RESPONSE_HEADERS : CUSTOM_HTML_RESPONSE_HEADERS),
			"cache-control": "private, no-store",
		},
	});
}
