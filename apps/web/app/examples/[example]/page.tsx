import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Command, ContentPage, ContentSection, Steps } from "@/components/content-page";
import { EXAMPLES, isExampleId } from "@/lib/examples";
import { pageMetadata } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
	return Object.keys(EXAMPLES).map((example) => ({ example }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ example: string }>;
}): Promise<Metadata> {
	const { example } = await params;
	if (!isExampleId(example)) return {};
	const content = EXAMPLES[example];
	return pageMetadata({
		title: content.title,
		description: content.description,
		path: `/examples/${example}`,
	});
}

export default async function ExamplePage({ params }: { params: Promise<{ example: string }> }) {
	const { example } = await params;
	if (!isExampleId(example)) notFound();
	const content = EXAMPLES[example];

	return (
		<ContentPage
			path={`/examples/${example}`}
			eyebrow="Runnable example"
			title={content.title}
			description={content.description}
			related={[
				["All examples", "/examples"],
				["CLI reference", "/docs/cli"],
				["Agent setup", "/docs/agent-setup"],
				["Plan handoff guide", "/agent-plan-handoff"],
			]}
		>
			<ContentSection title="Scenario">
				<p>{content.scenario}</p>
			</ContentSection>

			<ContentSection title="Workflow">
				<Steps
					items={[
						[
							"Start in the intended repository",
							"Project and branch context come from Git, so check the working directory before adding plans.",
						],
						[
							"Run the commands in order",
							"Keep the returned plan ids; placeholder ids below stand for the ids printed by your own store.",
						],
						[
							"Inspect each transition",
							"Use JSON output for automation and the browser viewer when a human needs to review the artifact.",
						],
						["Verify the outcome", content.proof],
					]}
				/>
				<Command>{content.commands}</Command>
			</ContentSection>

			<ContentSection title="What this example proves">
				<p>{content.proof}</p>
				<p>
					The example uses no customer data and does not require a hosted account. Add
					<code>--local</code> when you want to guarantee that a sample remains only on the current
					machine.
				</p>
			</ContentSection>
		</ContentPage>
	);
}
