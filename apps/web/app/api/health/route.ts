import { storeRoot } from "@hostplan/core";

export const dynamic = "force-dynamic";

/** The CLI probes this to tell our server apart from whatever else owns the port. */
export function GET() {
	return Response.json({ app: "hostplan", version: "0.1.0", store: storeRoot() });
}
