import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
	CardGrid,
	Command,
	ContentPage,
	ContentSection,
	InfoCard,
	Steps,
} from "@/components/content-page";
import { INTEGRATIONS, isIntegrationId } from "@/lib/integrations";
import { pageMetadata } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
	return Object.keys(INTEGRATIONS).map((app) => ({ app }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ app: string }>;
}): Promise<Metadata> {
	const { app } = await params;
	if (!isIntegrationId(app)) return {};
	const integration = INTEGRATIONS[app];
	return pageMetadata({
		title: `Open coding-agent plans in ${integration.name}`,
		description: integration.description,
		path: `/integrations/${app}`,
	});
}

export default async function IntegrationPage({ params }: { params: Promise<{ app: string }> }) {
	const { app } = await params;
	if (!isIntegrationId(app)) notFound();
	const integration = INTEGRATIONS[app];

	return (
		<ContentPage
			path={`/integrations/${app}`}
			eyebrow="Agent handoff"
			title={`Open a Hostplan plan in ${integration.name}`}
			description={integration.description}
			related={[
				["Plan handoff workflow", "/agent-plan-handoff"],
				["Agent setup guide", "/docs/agent-setup"],
				["Handoff example", "/examples/agent-handoff"],
				["CLI reference", "/docs/cli"],
			]}
		>
			<ContentSection title={`What the ${integration.name} handoff does`}>
				<p>
					{integration.handoff} Hostplan selects a local file path only for the plan owner. A
					recipient reading a shared plan receives the plan URL instead, because the owner&apos;s
					filesystem path would be private and unusable on another machine.
				</p>
				<Command>{integration.scheme}</Command>
			</ContentSection>

			<ContentSection title="How to use it">
				<Steps
					items={[
						[
							"Open the plan",
							"Read the rendered plan in Hostplan and confirm that it is the intended current revision.",
						],
						[
							"Choose the agent",
							`Open the agent menu and select ${integration.name}. Hostplan remembers that selection for the next plan.`,
						],
						[
							"Review the prompt",
							"The destination app opens with a prepared prompt. Check the plan path or URL and the project context.",
						],
						[
							"Start deliberately",
							"Submit the prompt in the agent only after the handoff information looks correct.",
						],
					]}
				/>
			</ContentSection>

			<ContentSection title="Support details">
				<CardGrid>
					<InfoCard title="Last tested">
						July 28, 2026 against the current Hostplan deep-link implementation.
					</InfoCard>
					<InfoCard title="Known limitation">{integration.limitation}</InfoCard>
					<InfoCard title="Privacy boundary">
						Shared readers receive a URL, never the owner's local plan path or working directory.
					</InfoCard>
					<InfoCard title="Execution boundary">
						Opening an agent prepares context but never approves a draft or marks a plan in progress
						automatically.
					</InfoCard>
				</CardGrid>
			</ContentSection>

			<ContentSection title="Relationship to the agent vendor">
				<p>
					This page documents Hostplan&apos;s use of an observed {integration.company} app URL
					scheme. Hostplan is not claiming an official partnership, endorsement, or bundled
					integration. Deep-link behavior can change, so verify the current support note if a
					handoff stops opening as described.
				</p>
			</ContentSection>
		</ContentPage>
	);
}
