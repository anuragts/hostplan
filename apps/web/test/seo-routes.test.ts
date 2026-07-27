import { describe, expect, test } from "bun:test";
import { GET as llms } from "../app/llms.txt/route";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { HOME_JSON_LD, PUBLIC_ROUTES, pageMetadata, SITE_URL } from "../lib/site";

describe("SEO discovery routes", () => {
	test("sitemap contains every public page and no private surfaces", () => {
		const entries = sitemap();
		expect(entries.map((entry) => new URL(entry.url).pathname)).toEqual([...PUBLIC_ROUTES]);
		expect(entries.every((entry) => entry.url.startsWith(SITE_URL))).toBe(true);
		expect(entries.some((entry) => entry.url.includes("/p/"))).toBe(false);
		expect(entries.some((entry) => entry.url.includes("/api/"))).toBe(false);
		expect(entries.some((entry) => entry.url.includes("/login"))).toBe(false);
	});

	test("robots advertises the sitemap and blocks sensitive route families", () => {
		const value = robots();
		expect(value.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
		expect(value.host).toBe(SITE_URL);
		const serialized = JSON.stringify(value.rules);
		for (const path of ["/api/", "/p/", "/login", "/cli", "/settings/"]) {
			expect(serialized).toContain(path);
		}
		expect(serialized).toContain("OAI-SearchBot");
	});

	test("llms map links canonical public pages and states the privacy boundary", async () => {
		const response = llms();
		const body = await response.text();
		expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
		expect(body).toContain(`${SITE_URL}/coding-agent-plans`);
		expect(body).toContain("Live customer plan pages");
		expect(body).not.toContain("?code=");
	});

	test("page metadata uses one canonical URL and matching social URLs", () => {
		const metadata = pageMetadata({
			title: "Example",
			description: "Example description",
			path: "/examples",
		});
		expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/examples`);
		expect(metadata.openGraph?.url).toBe(`${SITE_URL}/examples`);
		expect(metadata.openGraph?.title).toBe("Example");
	});

	test("structured data describes only visible, verifiable product facts", () => {
		expect(HOME_JSON_LD["@context"]).toBe("https://schema.org");
		expect(HOME_JSON_LD["@graph"].map((entry) => entry["@type"])).toEqual([
			"Organization",
			"WebSite",
			"SoftwareApplication",
		]);
		const serialized = JSON.stringify(HOME_JSON_LD);
		expect(serialized).toContain("https://github.com/anuragts/hostplan");
		expect(serialized).not.toContain("aggregateRating");
		expect(serialized).not.toContain("review");
		expect(serialized).not.toContain("offers");
	});
});
