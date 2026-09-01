import { describe, expect, test } from "bun:test";
import { isTrustedHtml, markTrustedHtml, stripTrustedHtmlMarker } from "../lib/trusted-html";

const marker = "<!--hostplan-trusted-html-v1-->";

describe("trusted HTML marker", () => {
	test("only trusts a marker in the document preamble", () => {
		expect(isTrustedHtml(markTrustedHtml("<!doctype html><html></html>"))).toBe(true);
		expect(isTrustedHtml(`<html><body>${marker}</body></html>`)).toBe(false);
	});

	test("strips every occurrence", () => {
		expect(stripTrustedHtmlMarker(`${marker}${marker}${marker}<html></html>`)).toBe(
			"<html></html>",
		);
	});
});
