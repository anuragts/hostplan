import { afterEach, describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { PUBLIC_ROUTES } from "../lib/site";
import { isPublicRoute, middleware } from "../middleware";

const originalAccounts = process.env.HOSTPLAN_ACCOUNTS;

afterEach(() => {
	if (originalAccounts === undefined) delete process.env.HOSTPLAN_ACCOUNTS;
	else process.env.HOSTPLAN_ACCOUNTS = originalAccounts;
});

function request(path: string, headers: Record<string, string>): NextRequest {
	return new NextRequest(`https://plans.host-plan.com${path}`, { headers });
}

describe("plan middleware", () => {
	test("internally rewrites curl requests and preserves the share code", () => {
		const response = middleware(
			request("/p/a3f9c2?code=KRWT", {
				accept: "*/*",
				"user-agent": "curl/8.7.1",
			}),
		);

		expect(response.headers.get("x-middleware-rewrite")).toBe(
			"https://plans.host-plan.com/api/raw/a3f9c2?code=KRWT",
		);
	});

	test("does not rewrite browser or RSC requests", () => {
		const browser = middleware(request("/p/a3f9c2", { accept: "text/html,*/*;q=0.8" }));
		const rsc = middleware(request("/p/a3f9c2", { accept: "*/*", rsc: "1" }));

		expect(browser.headers.get("x-middleware-rewrite")).toBeNull();
		expect(rsc.headers.get("x-middleware-rewrite")).toBeNull();
	});

	test("keeps the existing account guard away from browser plan pages", () => {
		process.env.HOSTPLAN_ACCOUNTS = "1";
		const response = middleware(request("/p/a3f9c2", { accept: "text/html" }));

		expect(response.headers.get("location")).toBeNull();
	});

	test("still redirects anonymous account-only pages", () => {
		process.env.HOSTPLAN_ACCOUNTS = "1";
		const response = middleware(request("/settings/tokens", { accept: "text/html" }));

		expect(response.headers.get("location")).toBe(
			"https://plans.host-plan.com/login?next=%2Fsettings%2Ftokens",
		);
		expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
	});

	test("keeps every intentional public content route anonymous", () => {
		process.env.HOSTPLAN_ACCOUNTS = "1";
		for (const path of PUBLIC_ROUTES) {
			const response = middleware(request(path, { accept: "text/html" }));
			expect(response.headers.get("location")).toBeNull();
			expect(isPublicRoute(path)).toBe(true);
		}
	});

	test("serves public content to search and answer-engine crawlers", () => {
		process.env.HOSTPLAN_ACCOUNTS = "1";
		for (const userAgent of ["Googlebot", "bingbot", "OAI-SearchBot"]) {
			const response = middleware(
				request("/coding-agent-plans", { accept: "text/html", "user-agent": userAgent }),
			);
			expect(response.headers.get("location")).toBeNull();
		}
	});

	test("keeps crawler discovery and social image routes anonymous", () => {
		process.env.HOSTPLAN_ACCOUNTS = "1";
		for (const path of [
			"/robots.txt",
			"/sitemap.xml",
			"/llms.txt",
			"/opengraph-image",
			"/74bd004c41f144310fb8cad8cefb4191.txt",
		]) {
			const response = middleware(request(path, { accept: "*/*" }));
			expect(response.headers.get("location")).toBeNull();
			expect(isPublicRoute(path)).toBe(true);
		}
	});

	test("does not treat unknown content-shaped paths as public", () => {
		process.env.HOSTPLAN_ACCOUNTS = "1";
		const response = middleware(request("/integrations/unverified-agent", { accept: "text/html" }));
		expect(response.headers.get("location")).toBe(
			"https://plans.host-plan.com/login?next=%2Fintegrations%2Funverified-agent",
		);
		expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
		expect(isPublicRoute("/integrations/unverified-agent")).toBe(false);
	});
});
