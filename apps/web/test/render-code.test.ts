import { describe, expect, test } from "bun:test";
import { renderMarkdown } from "../lib/render";

describe("markdown code rendering", () => {
	test("emits highlighted code with the base dark palette", async () => {
		const html = await renderMarkdown("```ts\nconst highlighted = true;\n```");

		expect(html).toContain('class="shiki github-dark');
		expect(html).toContain('style="color:');
		expect(html).not.toContain("--shiki-dark:");
	});
});
