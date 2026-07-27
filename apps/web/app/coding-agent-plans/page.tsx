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
	"A coding-agent plan is a durable implementation brief that preserves decisions, scope, and progress between AI coding sessions.";

export const metadata: Metadata = pageMetadata({
	title: "Coding-agent plans: a durable implementation handoff",
	description,
	path: "/coding-agent-plans",
});

export default function CodingAgentPlansPage() {
	return (
		<ContentPage
			path="/coding-agent-plans"
			eyebrow="Guide"
			title="What is a coding-agent plan?"
			description={description}
			related={[
				["How to hand off a plan", "/agent-plan-handoff"],
				["Hostplan vs. PLAN.md", "/compare/plan-md-vs-hostplan"],
				["See runnable examples", "/examples"],
				["Set up Hostplan for agents", "/docs/agent-setup"],
			]}
		>
			<ContentSection title="The short answer">
				<p>
					A coding-agent plan is the contract between understanding a software change and
					implementing it. It records the intended outcome, relevant code, decisions, constraints,
					ordered work, and verification so another session—or another agent—can continue without
					reconstructing the entire conversation.
				</p>
				<p>
					Hostplan gives that contract a stable identity. The plan remains plain Markdown on disk,
					but it can also have a short URL, lifecycle status, task state, project and branch
					context, and a direct handoff into a coding agent.
				</p>
			</ContentSection>

			<ContentSection title="What a useful plan contains">
				<CardGrid>
					<InfoCard title="Outcome and boundaries">
						What must be true when the work is done, what is explicitly out of scope, and which
						user-visible behavior must remain unchanged.
					</InfoCard>
					<InfoCard title="Source-backed context">
						The files, routes, contracts, and current behavior the implementer needs—not a dump of
						everything discovered during research.
					</InfoCard>
					<InfoCard title="Decisions and reasons">
						The choices already made, alternatives rejected, and constraints that should not be
						quietly reopened during implementation.
					</InfoCard>
					<InfoCard title="Proof of completion">
						Tests, builds, live checks, screenshots, or other evidence that demonstrates the outcome
						rather than merely showing that code changed.
					</InfoCard>
				</CardGrid>
			</ContentSection>

			<ContentSection title="Why chat history is not enough">
				<p>
					Chat is optimized for conversation, not durable project state. Threads become long,
					context windows compact, temporary worktrees disappear, and a plan pasted into a message
					has no independent lifecycle. The next session often has to ask which plan was approved
					and whether any of it was already completed.
				</p>
				<p>
					A stored plan separates the artifact from the conversation. The agent can retrieve the
					current version by id or by project and branch, while a human can read the same plan in a
					browser.
				</p>
			</ContentSection>

			<ContentSection title="The Hostplan workflow">
				<Steps
					items={[
						[
							"Write",
							"Create a focused Markdown implementation plan in the repository or a scratch location.",
						],
						[
							"Store",
							"Run hsp add. Hostplan detects the project and branch, stores the source, and returns an id and URL.",
						],
						["Approve", "Keep new plans in draft until a human explicitly approves the direction."],
						[
							"Execute",
							"Move the plan to in-progress, hand it into a coding agent, and check tasks off as work lands.",
						],
						["Finish", "Mark the plan done only after the required verification passes."],
					]}
				/>
				<Command>{`hsp add PLAN.md
hsp status <id> approved
hsp status <id> in-progress
hsp check <id> 1 2
hsp status <id> done`}</Command>
			</ContentSection>

			<ContentSection title="When Hostplan is the right tool">
				<CardGrid>
					<InfoCard title="Use Hostplan when">
						Plans move between sessions, agents, or teammates; several branches are active; a plan
						needs approval or progress state; or a URL is easier to hand off than a local path.
					</InfoCard>
					<InfoCard title="Keep a plain PLAN.md when">
						One repository has one active plan, the file belongs in version control, every reader
						has the checkout, and no lifecycle or cross-agent handoff is needed.
					</InfoCard>
				</CardGrid>
			</ContentSection>

			<ContentSection title="Privacy and control">
				<p>
					Hostplan works locally against files under <code>~/.hostplan</code>. Hosted plans are
					private by default and use a share code; publishing is a deliberate command. Live plan
					pages are excluded from search indexing, including public plans, so a sharing decision
					does not quietly become a search-distribution decision.
				</p>
			</ContentSection>
		</ContentPage>
	);
}
