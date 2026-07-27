import { describe, expect, test } from "bun:test";
import { wantsPlanSource } from "../lib/plan-content-negotiation";

function headers(values: Record<string, string> = {}): Headers {
	return new Headers(values);
}

describe("plan content negotiation", () => {
	test("serves source to curl's wildcard request", () => {
		expect(wantsPlanSource(headers({ accept: "*/*", "user-agent": "curl/8.7.1" }))).toBe(true);
	});

	test("serves source when the client explicitly requests markdown or plain text", () => {
		expect(wantsPlanSource(headers({ accept: "text/markdown" }))).toBe(true);
		expect(wantsPlanSource(headers({ accept: "text/plain, */*;q=0.1" }))).toBe(true);
	});

	test("serves source when Accept is missing", () => {
		expect(wantsPlanSource(headers())).toBe(true);
	});

	test("keeps browser navigations on the rendered page", () => {
		expect(
			wantsPlanSource(
				headers({
					accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				}),
			),
		).toBe(false);
	});

	test("lets curl explicitly request the rendered page", () => {
		expect(wantsPlanSource(headers({ accept: "text/html", "user-agent": "curl/8.7.1" }))).toBe(
			false,
		);
	});

	test("never rewrites Next.js navigations or prefetches", () => {
		expect(wantsPlanSource(headers({ accept: "*/*", rsc: "1" }))).toBe(false);
		expect(
			wantsPlanSource(headers({ accept: "*/*", "next-router-state-tree": "%5B%22%22%5D" })),
		).toBe(false);
		expect(wantsPlanSource(headers({ accept: "*/*", "next-router-prefetch": "1" }))).toBe(false);
	});

	test("does not invent a representation for an unrelated media type", () => {
		expect(wantsPlanSource(headers({ accept: "application/json" }))).toBe(false);
	});

	test("ignores media types explicitly disabled with q=0", () => {
		expect(wantsPlanSource(headers({ accept: "text/html;q=0, text/markdown" }))).toBe(true);
		expect(wantsPlanSource(headers({ accept: "text/markdown;q=0" }))).toBe(false);
	});
});
