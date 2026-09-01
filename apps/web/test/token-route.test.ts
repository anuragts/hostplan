import { describe, expect, test } from "bun:test";
import { tokenCreatedRedirect } from "../lib/tokens";

describe("token creation", () => {
	test("returns the one-time secret in a URL fragment", () => {
		const location = tokenCreatedRedirect("https://plans.host-plan.com", "hsp_secret");
		expect(location).toContain("/settings/tokens#created=");
		expect(location).not.toContain("?created=");
	});
});
