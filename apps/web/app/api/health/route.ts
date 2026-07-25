import { storeRoot } from "@hostplan/core";
import { authEnabled, hasOwnerBearer } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * The CLI probes this to tell our server apart from whatever else owns the
 * port, so it stays reachable without credentials. The store path is a server
 * filesystem path though, so it's owner-only — an unauthenticated caller gets
 * just enough to identify the app.
 */
export function GET(request: Request) {
	const showDetail = !authEnabled() || hasOwnerBearer(request);
	return Response.json({
		app: "hostplan",
		version: "0.1.0",
		...(showDetail ? { store: storeRoot() } : {}),
	});
}
