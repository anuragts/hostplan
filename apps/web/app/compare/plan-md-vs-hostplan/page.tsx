import type { Metadata } from "next";
import {
	CardGrid,
	ComparisonTable,
	ContentPage,
	ContentSection,
	InfoCard,
} from "@/components/content-page";
import { pageMetadata } from "@/lib/site";

const description =
	"A plain PLAN.md is often enough. Compare it with Hostplan when plans need cross-session retrieval, sharing, lifecycle state, or coding-agent handoffs.";

export const metadata: Metadata = pageMetadata({
	title: "Hostplan vs. PLAN.md",
	description,
	path: "/compare/plan-md-vs-hostplan",
});

export default function PlanMdComparisonPage() {
	return (
		<ContentPage
			path="/compare/plan-md-vs-hostplan"
			eyebrow="Comparison"
			title="Hostplan vs. PLAN.md"
			description={description}
			related={[
				["What is a coding-agent plan?", "/coding-agent-plans"],
				["How plan sharing works", "/share-coding-agent-plans"],
				["See Hostplan examples", "/examples"],
				["Read the CLI reference", "/docs/cli"],
			]}
		>
			<ContentSection title="Start with the simpler tool">
				<p>
					If one repository has one current plan, every reader has the checkout, and the file should
					change with the code, use <code>PLAN.md</code>. It is transparent, diffable, and needs no
					additional tool.
				</p>
				<p>
					Hostplan becomes useful when the plan is an operational artifact that must survive across
					branches, sessions, people, or coding agents without relying on one working tree.
				</p>
			</ContentSection>

			<ContentSection title="Capability comparison">
				<ComparisonTable
					headers={["Need", "PLAN.md", "Hostplan"]}
					rows={[
						["Read locally", "Open the file", "Open the stored Markdown file or local viewer"],
						["Version with code", "Native Git history", "Revision history outside the repository"],
						[
							"Find by project and branch",
							"Use file placement or naming",
							"Detected and indexed automatically",
						],
						[
							"Share without a checkout",
							"Paste or host the file elsewhere",
							"Private or public URL",
						],
						[
							"Human and machine rendering",
							"Depends on the reader",
							"HTML for browsers, source for text clients",
						],
						[
							"Approval and execution state",
							"Write conventions into the file",
							"Draft → approved → in progress → done",
						],
						[
							"Ordered multi-plan work",
							"Manual links and filenames",
							"Dependency-aware stacks and hsp next",
						],
						[
							"Open in a coding agent",
							"Manually reference the path",
							"Prepared Codex, Claude Code, and Cursor handoffs",
						],
					]}
				/>
			</ContentSection>

			<ContentSection title="A practical decision rule">
				<CardGrid>
					<InfoCard title="Choose PLAN.md">
						The plan belongs in the pull request, the repository is the source of truth, and no one
						needs to read it outside that checkout.
					</InfoCard>
					<InfoCard title="Choose Hostplan">
						The plan precedes a branch, spans several worktrees, needs explicit approval, or must
						move between sessions and agents through a stable URL.
					</InfoCard>
				</CardGrid>
			</ContentSection>

			<ContentSection title="They can work together">
				<p>
					Hostplan does not require deleting repository plans. Add a checked-in
					<code>PLAN.md</code> when it belongs with the code, then store it in Hostplan to gain a
					stable id, browser viewer, share URL, and lifecycle. The source path remains recorded for
					the owner.
				</p>
			</ContentSection>
		</ContentPage>
	);
}
