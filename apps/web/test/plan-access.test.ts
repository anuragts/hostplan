import { describe, expect, test } from "bun:test";
import { ownsPlan } from "../lib/plan-access";

describe("plan ownership", () => {
	test("the local filesystem viewer owns local plans", () => {
		expect(ownsPlan({}, { kind: "local" })).toBe(true);
	});

	test("an anonymous viewer never owns a plan", () => {
		expect(ownsPlan({ ownerId: "user-a" }, { kind: "anonymous" })).toBe(false);
	});

	test("a signed-in viewer owns only their plans", () => {
		const db = {} as never;
		const owner = { kind: "user" as const, userId: "user-a", email: "a@example.com", db };
		const other = { kind: "user" as const, userId: "user-b", email: "b@example.com", db };

		expect(ownsPlan({ ownerId: "user-a" }, owner)).toBe(true);
		expect(ownsPlan({ ownerId: "user-a" }, other)).toBe(false);
		expect(ownsPlan({}, owner)).toBe(false);
	});
});
