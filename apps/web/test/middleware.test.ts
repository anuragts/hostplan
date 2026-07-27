import { afterEach, describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { middleware } from "../middleware";

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
	});
});
