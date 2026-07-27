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
	"Hand a software implementation plan between coding-agent sessions, teammates, Codex, Claude Code, and Cursor without losing decisions or progress.";

export const metadata: Metadata = pageMetadata({
	title: "Coding-agent plan handoffs without lost context",
	description,
	path: "/agent-plan-handoff",
});

export default function AgentPlanHandoffPage() {
	return (
		<ContentPage
			path="/agent-plan-handoff"
			eyebrow="Workflow"
			title="Hand off a coding-agent plan without losing context"
			description={description}
			related={[
				["Agent handoff example", "/examples/agent-handoff"],
				["Open plans in Codex", "/integrations/codex"],
				["Open plans in Claude Code", "/integrations/claude-code"],
				["Open plans in Cursor", "/integrations/cursor"],
			]}
		>
			<ContentSection title="A handoff is more than forwarding a prompt">
				<p>
					A reliable handoff tells the next implementer which plan is authoritative, what state it
					is in, which tasks are complete, what repository context applies, and how completion will
					be proven. Forwarding the final chat message carries text but usually loses that
					operational state.
				</p>
			</ContentSection>

			<ContentSection title="The handoff contract">
				<CardGrid>
					<InfoCard title="Identity">
						One plan id and URL that does not change when the body is revised.
					</InfoCard>
					<InfoCard title="Context">
						The source project, branch, and working directory when available to the owner.
					</InfoCard>
					<InfoCard title="State">
						Draft, approved, in progress, done, or superseded—with blocked stack dependencies
						visible.
					</InfoCard>
					<InfoCard title="Evidence">
						Unchecked tasks and explicit validation steps that tell the next agent what remains.
					</InfoCard>
				</CardGrid>
			</ContentSection>

			<ContentSection title="Handoff between sessions">
				<Steps
					items={[
						[
							"Finish the planning turn",
							"Store the plan and leave it in draft while the user reviews it.",
						],
						[
							"Approve the artifact",
							"Move the exact plan id to approved; do not approve a stale copy in chat.",
						],
						[
							"Start implementation",
							"The implementing session checks status, moves it to in-progress, and reads the current body.",
						],
						[
							"Record progress",
							"Check completed tasks and revise the same plan when implementation changes the approach.",
						],
						[
							"Close with proof",
							"Run the required checks and mark the plan done only when the outcome is actually delivered.",
						],
					]}
				/>
				<Command>{`hsp status y5bn0e
hsp get y5bn0e
hsp status y5bn0e in-progress
hsp tasks y5bn0e
hsp check y5bn0e 1 2`}</Command>
			</ContentSection>

			<ContentSection title="Handoff between coding agents">
				<p>
					The plan page&apos;s Open in control prepares a new Codex thread, Claude Code session, or
					Cursor agent prompt. It does not silently execute the plan: the destination opens with a
					prompt ready for human review.
				</p>
				<p>
					For a plan owned on the local machine, the handoff can include its local path and working
					directory. For a shared hosted plan, it points the receiving agent at the URL instead,
					avoiding meaningless or private filesystem paths.
				</p>
			</ContentSection>

			<ContentSection title="Split long implementations into a stack">
				<p>
					When one handoff would be too large, store an ordered stack. Each plan remains blocked
					until its dependency is done, and <code>hsp next</code> returns the first actionable step
					rather than asking an agent to infer order from filenames.
				</p>
				<Command>{`hsp stack 01-schema.md 02-api.md 03-ui.md
hsp next
hsp status <first-id> done
hsp next`}</Command>
			</ContentSection>
		</ContentPage>
	);
}
