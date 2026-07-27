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
	"Share a coding-agent plan without pasting it into chat: keep one canonical source, choose private or public access, and let people or agents read the same URL.";

export const metadata: Metadata = pageMetadata({
	title: "How to share a coding-agent plan",
	description,
	path: "/share-coding-agent-plans",
});

export default function ShareCodingAgentPlansPage() {
	return (
		<ContentPage
			path="/share-coding-agent-plans"
			eyebrow="Workflow"
			title="How to share a coding-agent plan"
			description={description}
			related={[
				["Agent-to-agent handoffs", "/agent-plan-handoff"],
				["Plan lifecycle example", "/examples/plan-lifecycle"],
				["CLI sharing reference", "/docs/cli"],
				["Privacy model", "/about"],
			]}
		>
			<ContentSection title="Use one URL for people and agents">
				<p>
					A Hostplan share URL is content-negotiated. A browser receives the rendered plan viewer;{" "}
					<code>curl</code> or a client requesting Markdown receives the original plan source. Both
					readers refer to the same plan id and current revision.
				</p>
				<Command>{`# Human: open the URL in a browser
https://plans.host-plan.com/p/a3f9c2?code=KRWT

# Agent or script: fetch the same URL
curl -fsSL 'https://plans.host-plan.com/p/a3f9c2?code=KRWT'`}</Command>
			</ContentSection>

			<ContentSection title="Share privately by default">
				<Steps
					items={[
						[
							"Add the plan",
							"hsp add stores it locally and, when signed in, pushes the same id to your deployment.",
						],
						[
							"Use the coded URL",
							"The bare URL asks for a four-letter code; the coded URL opens directly for the recipient.",
						],
						[
							"Rotate when needed",
							"hsp rotate issues a new code and invalidates the old coded link.",
						],
						[
							"Publish deliberately",
							"hsp publish removes the code only when anyone with the bare URL should be able to read it.",
						],
					]}
				/>
			</ContentSection>

			<ContentSection title="Choose the access model">
				<CardGrid>
					<InfoCard title="Local only">
						Use <code>hsp add --local</code>. Nothing is uploaded; the URL points at the local
						viewer and only works on that machine.
					</InfoCard>
					<InfoCard title="Private hosted link">
						The default hosted mode. Readers need the share code, while the owner can rotate or
						revoke access without changing the plan id.
					</InfoCard>
					<InfoCard title="Public by link">
						Use <code>hsp publish</code> for material intentionally readable without a code.
						Hostplan still keeps plan pages out of search indexes.
					</InfoCard>
					<InfoCard title="Repository file">
						If every collaborator already has the repository and the plan belongs in history, commit
						a <code>PLAN.md</code> instead of creating another sharing layer.
					</InfoCard>
				</CardGrid>
			</ContentSection>

			<ContentSection title="What not to put in a shared plan">
				<p>
					Do not include credentials, API tokens, private keys, production customer data, or other
					secrets. A four-letter code is casual access control, not cryptographic protection. Refer
					to secret locations or secure systems rather than copying sensitive values into the plan.
				</p>
			</ContentSection>
		</ContentPage>
	);
}
