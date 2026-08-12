import { describe, expect, test } from "bun:test";
import { renderMarkdown } from "../lib/render";

describe("Mermaid markdown rendering", () => {
	test("turns Mermaid block diagrams into reserved client-rendered surfaces", async () => {
		const html = await renderMarkdown(`
\`\`\`mermaid
block
  columns 2
  api["API"] worker["Worker"]
  api --> worker
\`\`\`
`);

		expect(html).toContain('class="plan-mermaid"');
		expect(html).toContain('data-mermaid-state="loading"');
		expect(html).toContain("block\n  columns 2");
		expect(html).not.toContain('class="shiki');
	});

	test("keeps ordinary code fences in the syntax-highlighting path", async () => {
		const html = await renderMarkdown("```ts\nconst ready = true;\n```");

		expect(html).toContain('class="shiki');
		expect(html).not.toContain("plan-mermaid");
	});
});
