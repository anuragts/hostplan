import type { Metadata } from "next";
import { CardGrid, ContentPage, ContentSection, InfoCard } from "@/components/content-page";
import { pageMetadata, REPOSITORY_URL } from "@/lib/site";

const description =
	"Hostplan is an MIT-licensed, local-first tool for storing, sharing, resuming, and handing off coding-agent implementation plans.";

export const metadata: Metadata = pageMetadata({
	title: "About Hostplan",
	description,
	path: "/about",
});

export default function AboutPage() {
	return (
		<ContentPage
			path="/about"
			eyebrow="Project"
			title="About Hostplan"
			description={description}
			related={[
				["How Hostplan works", "/coding-agent-plans"],
				["CLI documentation", "/docs/cli"],
				["Agent setup", "/docs/agent-setup"],
				["Examples", "/examples"],
			]}
		>
			<ContentSection title="What Hostplan is">
				<p>
					Hostplan is an open-source CLI and web viewer that gives coding-agent plans stable,
					shareable, machine-readable URLs. Plans stay as plain files locally, are grouped by Git
					project and branch, and can be pushed to an account-backed deployment when they need to
					travel.
				</p>
				<p>
					The project is built for implementation plans rather than general project management:
					draft approval, execution status, ordered plan stacks, addressable tasks, revisions, and
					one-click handoffs into coding agents.
				</p>
			</ContentSection>

			<ContentSection title="Project facts">
				<CardGrid>
					<InfoCard title="License">
						MIT. The source is available for inspection, modification, and self-hosting.
					</InfoCard>
					<InfoCard title="Storage">
						Plain Markdown or HTML files locally; Supabase-backed accounts for hosted deployments.
					</InfoCard>
					<InfoCard title="Interfaces">
						The global hsp CLI, a local viewer, and an optional hosted dashboard and sharing layer.
					</InfoCard>
					<InfoCard title="Maintainer">
						The project is maintained in the public anuragts/hostplan GitHub repository.
					</InfoCard>
				</CardGrid>
			</ContentSection>

			<ContentSection title="Compatibility policy">
				<p>
					Hostplan documents observed deep-link behavior for Codex, Claude Code, and Cursor. That
					does not imply a commercial partnership or official endorsement by OpenAI, Anthropic, or
					Anysphere. Integration pages include limitations and a last-tested date.
				</p>
			</ContentSection>

			<ContentSection title="Crawler policy">
				<p>
					Hostplan explicitly permits <code>OAI-SearchBot</code> on public product and documentation
					pages so they are eligible for ChatGPT Search. <code>GPTBot</code>
					follows the general public-page crawler policy; model-training access is a separate
					decision and can be changed without blocking search discovery. Customer plan pages,
					account routes, APIs, and owner indexes remain outside the public search surface.
				</p>
			</ContentSection>

			<ContentSection title="Updates and support">
				<p>
					Code, documentation changes, bugs, and feature discussions live in the{" "}
					<a
						href={REPOSITORY_URL}
						target="_blank"
						rel="noreferrer"
						className="text-brand underline underline-offset-4"
					>
						public GitHub repository
					</a>
					. Product documentation is updated alongside the implementation; commands should be
					checked against the current CLI before use.
				</p>
			</ContentSection>
		</ContentPage>
	);
}
