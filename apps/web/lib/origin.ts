/**
 * The origin the browser actually used. Behind Vercel's proxy the request URL
 * is internal http, so redirects built from it would downgrade the scheme and
 * point at the wrong host.
 */
export function origin(request: Request): string {
	const url = new URL(request.url);
	const host = request.headers.get("host") ?? url.host;
	const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
	return `${proto}://${host}`;
}
