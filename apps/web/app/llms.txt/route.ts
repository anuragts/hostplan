import { PUBLIC_ROUTES, SITE_DESCRIPTION, SITE_URL } from "@/lib/site";

export function GET() {
	const links = PUBLIC_ROUTES.filter((path) => path !== "/")
		.map((path) => `- ${SITE_URL}${path}`)
		.join("\n");
	const body = `# Hostplan

> ${SITE_DESCRIPTION}

Hostplan is an open-source, local-first CLI and web viewer for coding-agent
implementation plans. It stores plans by Git project and branch, gives each
plan a stable id, supports draft-to-done lifecycle and ordered stacks, and can
hand a reviewed plan into Codex, Claude Code, or Cursor.

Canonical public pages:

${links}

Source:

- https://github.com/anuragts/hostplan

Important boundaries:

- Live customer plan pages and authenticated project indexes are not search content.
- Hosted plans are private by default unless their owner explicitly publishes them.
- Agent deep links prepare prompts for user review; they do not execute plans automatically.
- OAI-SearchBot search access and GPTBot model-training access are separate policy decisions.
`;

	return new Response(body, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, max-age=3600, s-maxage=86400",
		},
	});
}
