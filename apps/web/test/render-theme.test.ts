import { describe, expect, test } from "bun:test";
import { renderMarkdown } from "../lib/render";

describe("theme-aware markdown rendering", () => {
	test("emits light colors plus dark Shiki token variables once", async () => {
		const html = await renderMarkdown("```ts\nconst themed = true;\n```");

		expect(html).toContain("--shiki-dark:");
		expect(html).toContain('style="color:');
		expect(html).toContain('class="shiki');
	});
});
