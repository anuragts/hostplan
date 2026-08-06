import { CUSTOM_HTML_COMPONENTS, CUSTOM_HTML_PROFILE, CUSTOM_HTML_SKELETON } from "@hostplan/core";
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
	"Give coding agents a safe, composable HTML and CSS canvas for visual implementation plans without scripts or external assets.";

export const metadata: Metadata = pageMetadata({
	title: "Custom HTML plans",
	description,
	path: "/docs/custom-html-plans",
});

export default function CustomHtmlPlansPage() {
	return (
		<ContentPage
			path="/docs/custom-html-plans"
			eyebrow="Documentation"
			title="Custom HTML plans"
			description={description}
			related={[
				["Agent setup", "/docs/agent-setup"],
				["CLI reference", "/docs/cli"],
				["Plan handoffs", "/agent-plan-handoff"],
			]}
		>
			<ContentSection title="Agent workflow">
				<Steps
					items={[
						[
							"Fetch the contract",
							"Run hsp guide custom-html so the agent sees the current profile, components, tokens, and response rules.",
						],
						[
							"Compose the document",
							"Use semantic HTML and Hostplan primitives, then add one inline style block for plan-specific art direction.",
						],
						[
							"Validate before storage",
							"Run hsp validate plan.html for actionable structural, security, accessibility, and component diagnostics.",
						],
						[
							"Store and share",
							"Run hsp add plan.html and give the reader the normal Hostplan link.",
						],
					]}
				/>
				<Command>{`hsp guide custom-html > /tmp/hostplan-html-contract.txt
hsp validate plan.html
hsp add plan.html`}</Command>
			</ContentSection>

			<ContentSection title="Composable primitives">
				<p>
					The <code>{CUSTOM_HTML_PROFILE}</code> profile supplies a versioned, scriptless CSS kit.
					Agents can combine these primitives or add their own non-<code>hp-</code> classes.
				</p>
				<CardGrid>
					{CUSTOM_HTML_COMPONENTS.map((component) => (
						<InfoCard key={component.name} title={component.name}>
							<p>{component.description}</p>
							<p className="mt-2 font-mono text-ink-faint text-xs">
								{component.classes.map((className) => `.${className}`).join(" · ")}
							</p>
						</InfoCard>
					))}
				</CardGrid>
			</ContentSection>

			<ContentSection title="Starter document">
				<p>
					The CLI guide contains the same skeleton. The profile is pinned so a future component
					version cannot silently redesign an old shared plan.
				</p>
				<Command>{CUSTOM_HTML_SKELETON}</Command>
			</ContentSection>

			<ContentSection title="Security boundary">
				<p>
					Custom documents render in a unique-origin sandbox. Scripts, network requests, remote
					assets, frames, form submission, and top-level navigation remain blocked even if an
					authoring check misses something. Raw and curl responses still return the exact stored
					source; Hostplan injects component CSS only into the rendered copy.
				</p>
			</ContentSection>
		</ContentPage>
	);
}
