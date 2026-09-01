import { describe, expect, test } from "bun:test";
import { nextStartArgs } from "../src/daemon";

describe("viewer daemon", () => {
	test("binds Next.js to loopback only", () => {
		expect(nextStartArgs(7433)).toEqual(["start", "-H", "127.0.0.1", "-p", "7433"]);
	});
});
