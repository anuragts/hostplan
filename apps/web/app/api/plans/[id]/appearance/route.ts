import { isId } from "@hostplan/core";
import { adminPlanStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Theme is deliberately public presentation metadata. Keep this response
 * allowlisted: private plan titles, status, scope, paths, codes, and content
 * remain behind the normal plan access gate.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	if (!isId(id)) return Response.json({ error: "not found" }, { status: 404 });

	const store = adminPlanStore();
	const meta = store.getMeta === undefined ? (await store.get(id))?.meta : await store.getMeta(id);
	if (meta === undefined) return Response.json({ error: "not found" }, { status: 404 });

	return Response.json(
		{ theme: meta.theme, version: 1 },
		{
			headers: {
				"cache-control": "public, max-age=60, stale-while-revalidate=300",
			},
		},
	);
}
