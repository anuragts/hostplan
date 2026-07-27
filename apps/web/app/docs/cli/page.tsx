import type { Metadata } from "next";
import {
	CardGrid,
	Command,
	ContentPage,
	ContentSection,
	InfoCard,
} from "@/components/content-page";
import { pageMetadata } from "@/lib/site";

const description =
	"Hostplan CLI reference for storing, reading, sharing, approving, stacking, revising, searching, and completing coding-agent plans.";

export const metadata: Metadata = pageMetadata({
	title: "Hostplan CLI reference",
	description,
	path: "/docs/cli",
});

export default function CliReferencePage() {
	return (
		<ContentPage
			path="/docs/cli"
			eyebrow="Documentation"
			title="Hostplan CLI reference"
			description={description}
			related={[
				["Install the agent skill", "/docs/agent-setup"],
				["Plan lifecycle example", "/examples/plan-lifecycle"],
				["Share a coding-agent plan", "/share-coding-agent-plans"],
				["Plan stack example", "/examples/plan-stack"],
			]}
		>
			<ContentSection title="Install from source">
				<p>
					Hostplan currently requires Bun and Node 20 or newer. The npm package is not published
					yet; install the CLI from the public repository.
				</p>
				<Command>{`git clone https://github.com/anuragts/hostplan.git
cd hostplan
bun install
bun run build
bun link
hsp --help`}</Command>
			</ContentSection>

			<ContentSection title="Store a plan">
				<Command>{`hsp add PLAN.md
hsp add -c "# Title\\n..." -t "Title"
hsp add PLAN.md --public
hsp add PLAN.md --local
hsp add PLAN.md --status approved
hsp add PLAN.md --json`}</Command>
				<p>
					Hostplan detects the current Git project and branch. Use <code>--project</code> or
					<code>--branch</code> only when the detected scope is not the intended one.
				</p>
			</ContentSection>

			<ContentSection title="Read and find plans">
				<CardGrid>
					<InfoCard title="Get">
						<code>hsp get &lt;id&gt;</code> prints the body. <code>hsp get latest</code> finds the
						newest plan in the current project and branch.
					</InfoCard>
					<InfoCard title="List">
						<code>hsp list</code> uses the current scope. Add <code>-a</code> for all plans or
						<code>-p &lt;project&gt;</code> for one project.
					</InfoCard>
					<InfoCard title="Search">
						<code>hsp search rate limiting</code> runs full-text search across plan titles and
						bodies.
					</InfoCard>
					<InfoCard title="Next">
						<code>hsp next</code> returns the first plan that is neither complete nor blocked by an
						unfinished dependency.
					</InfoCard>
				</CardGrid>
			</ContentSection>

			<ContentSection title="Manage lifecycle and tasks">
				<Command>{`hsp status <id>
hsp status <id> approved
hsp status <id> in-progress
hsp tasks <id>
hsp check <id> 2 3
hsp check <id> 2 --undo
hsp status <id> done`}</Command>
				<p>
					New plans start as drafts. An implementing agent should not begin until the plan is
					approved; move it to in progress when work starts and to done only after the required
					outcome and checks are complete.
				</p>
			</ContentSection>

			<ContentSection title="Build ordered plan stacks">
				<Command>{`hsp stack 01-schema.md 02-api.md 03-ui.md
hsp add 04-rollout.md --after <id>
hsp stack <id>
hsp next`}</Command>
				<p>
					Each plan in a stack depends on the one before it. Completing a step unblocks the next
					without merging several implementation phases into one oversized prompt.
				</p>
			</ContentSection>

			<ContentSection title="Revise and share">
				<Command>{`hsp update <id> PLAN.md
hsp share <id>
hsp publish <id>
hsp unpublish <id>
hsp rotate <id>`}</Command>
				<p>
					Updating revises the same plan id and URL. Publishing is deliberate; private plans get a
					share code, and rotating it invalidates the previous coded link.
				</p>
			</ContentSection>

			<ContentSection title="Connect a hosted deployment">
				<Command>{`hsp login
hsp whoami
hsp logout`}</Command>
				<p>
					Once signed in, <code>hsp add</code> writes locally and pushes the same plan id to the
					deployment. A failed remote push does not discard the local plan.
				</p>
			</ContentSection>

			<ContentSection title="Automation contract">
				<p>
					Every command that returns data accepts <code>--json</code>. Prefer structured output in
					agents and CI. Set <code>HOSTPLAN_REMOTE</code> and <code>HOSTPLAN_TOKEN</code> for
					unattended hosted access, and never print the token into a plan or build log.
				</p>
			</ContentSection>
		</ContentPage>
	);
}
