import { describe, expect, test } from "bun:test";
import { acquisitionSource, analyticsPath, sanitizedAnalyticsProperties } from "../lib/acquisition";

describe("analytics privacy", () => {
	test("redacts plan ids and owner routes", () => {
		expect(analyticsPath("/p/a3f9c2")).toBe("/p/:id");
		expect(analyticsPath("/secret-project/feat-private")).toBe("/private");
		expect(analyticsPath("/settings/tokens")).toBe("/private");
	});

	test("retains only known public content paths", () => {
		expect(analyticsPath("/coding-agent-plans")).toBe("/coding-agent-plans");
		expect(analyticsPath("/integrations/codex")).toBe("/integrations/codex");
		expect(analyticsPath("/integrations/unknown")).toBe("/private");
	});

	test("removes referrers, queries, and private path details from event properties", () => {
		const properties = sanitizedAnalyticsProperties(
			{
				$current_url: "https://plans.host-plan.com/p/secret?code=HUSH",
				$initial_current_url: "https://plans.host-plan.com/p/secret?code=HUSH",
				$referrer: "https://chatgpt.com/c/private-thread",
				$referring_domain: "chatgpt.com",
			},
			"https://plans.host-plan.com",
			"/p/secret",
		);
		expect(properties.$current_url).toBe("https://plans.host-plan.com/p/:id");
		expect(properties.$pathname).toBe("/p/:id");
		expect(properties.$initial_current_url).toBeUndefined();
		expect(properties.$referrer).toBeUndefined();
		expect(properties.$referring_domain).toBeUndefined();
	});
});

describe("acquisition source", () => {
	test("classifies AI and search referrals without retaining their URLs", () => {
		expect(acquisitionSource("https://chatgpt.com/c/secret")).toBe("chatgpt");
		expect(acquisitionSource("https://www.perplexity.ai/search?q=secret")).toBe("perplexity");
		expect(acquisitionSource("https://www.google.com/search?q=secret")).toBe("google");
		expect(acquisitionSource("https://www.bing.com/search?q=secret")).toBe("bing");
	});

	test("lets an explicit source override the referrer", () => {
		expect(acquisitionSource("", "chatgpt.com")).toBe("chatgpt");
		expect(acquisitionSource("https://example.com", "copilot")).toBe("bing");
	});

	test("distinguishes direct from unknown referrals", () => {
		expect(acquisitionSource("")).toBe("direct");
		expect(acquisitionSource("https://example.com/article")).toBe("other-referral");
	});
});
