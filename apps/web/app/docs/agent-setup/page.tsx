import type { Metadata } from "next";
import {
	CardGrid,
	Command,
	ContentPage,
	ContentSection,
	InfoCard,
	Steps,
} from "@/components/content-page";
import { pageMetadata } from "@/lib/site";

const description =
	"Teach Codex, Claude Code, and Cursor when to store, retrieve, approve, and update implementation plans with the Hostplan skill.";

export const metadata: Metadata = pageMetadata({
	title: "Set up Hostplan for coding agents",
	description,
	path: "/docs/agent-setup",
});

export default function AgentSetupPage() {
	return (
		<ContentPage
			path="/docs/agent-setup"
			eyebrow="Documentation"
			title="Set up Hostplan for coding agents"
			description={description}
			related={[
				["CLI reference", "/docs/cli"],
				["Agent handoff workflow", "/agent-plan-handoff"],
				["Open in Codex", "/integrations/codex"],
				["Agent handoff example", "/examples/agent-handoff"],
			]}
		>
			<ContentSection title="Install the skill by symlink">
				<p>
					The repository includes a Hostplan skill that teaches an agent when to save a plan, check
					approval, update progress, and read work created by another session. Symlink it so a Git
					pull updates the instructions in place.
				</p>
				<Command>{`# Run from the Hostplan repository
ln -sfn "$PWD/skills/hostplan" ~/.codex/skills/hostplan
ln -sfn "$PWD/skills/hostplan" ~/.claude/skills/hostplan
ln -sfn "$PWD/skills/hostplan" ~/.cursor/skills-cursor/hostplan`}</Command>
			</ContentSection>

			<ContentSection title="What the skill changes">
				<CardGrid>
					<InfoCard title="Plans get durable links">
						When an agent finishes a plan the user will read, it stores the plan with
						<code>hsp add</code> and returns the viewer URL.
					</InfoCard>
					<InfoCard title="Drafts do not execute themselves">
						Before implementation, the agent checks plan status and waits for explicit approval when
						it is still a draft.
					</InfoCard>
					<InfoCard title="Progress survives sessions">
						The implementing agent moves the plan to in progress and checks off addressable tasks as
						they are completed.
					</InfoCard>
					<InfoCard title="Revisions keep one identity">
						Review feedback updates the existing plan rather than creating a second link and an
						ambiguous source of truth.
					</InfoCard>
				</CardGrid>
			</ContentSection>

			<ContentSection title="Recommended agent flow">
				<Steps
					items={[
						[
							"Ask for a plan",
							"The agent researches the actual repository and writes a decision-complete implementation plan.",
						],
						[
							"Open the Hostplan link",
							"Review the rendered plan and request revisions on the same plan id.",
						],
						[
							"Approve explicitly",
							"Say go ahead or approve the plan. The implementing agent records that transition.",
						],
						[
							"Resume in any session",
							"Give another agent the URL or id; it reads the current plan and task state before changing code.",
						],
					]}
				/>
			</ContentSection>

			<ContentSection title="Verify the setup">
				<Command>{`hsp whoami
hsp add -c "# Skill smoke test\\n\\n- [ ] Verify retrieval" -t "Skill smoke test"
hsp get latest
hsp tasks latest`}</Command>
				<p>
					If <code>hsp</code> is not found, finish the source installation and run
					<code>bun link</code>. If hosted URLs are expected but <code>hsp whoami</code> reports
					local-only mode, run <code>hsp login</code>.
				</p>
			</ContentSection>

			<ContentSection title="Security boundary">
				<p>
					The skill coordinates plan files; it does not grant broader permission to publish code,
					push branches, expose private plans, or perform destructive actions. Existing repository
					and user instructions still control those actions.
				</p>
			</ContentSection>
		</ContentPage>
	);
}
