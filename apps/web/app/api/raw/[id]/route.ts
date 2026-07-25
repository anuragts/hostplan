import { getPlan, isId } from "@hostplan/core";

export const dynamic = "force-dynamic";

/** Serves a plan's original bytes — the source for the HTML iframe. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const plan = isId(id) ? await getPlan(id) : undefined;
	if (plan === undefined) return new Response("not found", { status: 404 });

	const contentType =
		plan.meta.format === "html" ? "text/html; charset=utf-8" : "text/markdown; charset=utf-8";

	return new Response(plan.body, {
		headers: {
			"content-type": contentType,
			// Belt and braces alongside the iframe's sandbox attribute.
			"content-security-policy": "sandbox; default-src 'none'; style-src 'unsafe-inline'",
			"x-content-type-options": "nosniff",
		},
	});
}
