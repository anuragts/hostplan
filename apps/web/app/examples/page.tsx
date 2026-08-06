import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/content-page";
import { EXAMPLES } from "@/lib/examples";
import { pageMetadata } from "@/lib/site";

const description =
	"Runnable Hostplan examples for visual HTML plans, coding-agent plan lifecycle, dependency-aware stacks, task tracking, and cross-agent handoffs.";

export const metadata: Metadata = pageMetadata({
	title: "Coding-agent plan examples",
	description,
	path: "/examples",
});

export default function ExamplesPage() {
	return (
		<ContentPage
			path="/examples"
			eyebrow="Examples"
			title="Runnable coding-agent plan workflows"
			description={description}
			related={[
				["CLI reference", "/docs/cli"],
				["What is a coding-agent plan?", "/coding-agent-plans"],
				["Agent setup", "/docs/agent-setup"],
				["Share a plan", "/share-coding-agent-plans"],
			]}
		>
			<ContentSection title="Choose a workflow">
				<div className="grid gap-4">
					{Object.entries(EXAMPLES).map(([id, example]) => (
						<Link
							key={id}
							href={`/examples/${id}`}
							className="rounded-xl bg-surface-raised p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-[box-shadow,scale] duration-150 ease-out hover:shadow-[0_0_0_1px_rgba(255,255,255,0.13)] active:scale-[0.96]"
						>
							<h3 className="font-medium text-ink">{example.shortTitle}</h3>
							<p className="mt-2 text-pretty text-ink-muted text-sm leading-6">
								{example.description}
							</p>
						</Link>
					))}
				</div>
			</ContentSection>

			<ContentSection title="Use isolated sample storage">
				<p>
					To experiment without mixing sample plans into your real store, point Hostplan at a
					temporary directory for the shell session:
				</p>
				<pre className="overflow-x-auto rounded-xl bg-surface-raised p-5 font-mono text-ink text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
					<code>export HOSTPLAN_HOME=/tmp/hsp-examples</code>
				</pre>
			</ContentSection>
		</ContentPage>
	);
}
