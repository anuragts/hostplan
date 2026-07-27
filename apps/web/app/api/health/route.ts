import packageInfo from "../../../../../package.json" with { type: "json" };

export const dynamic = "force-dynamic";

/**
 * The CLI probes this to tell our server apart from whatever else owns the
 * port, so it stays reachable without credentials — and says nothing beyond
 * enough to identify the app.
 */
export function GET() {
	return Response.json({ app: "hostplan", version: packageInfo.version });
}
