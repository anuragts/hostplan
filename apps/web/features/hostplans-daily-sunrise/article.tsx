import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { MarketingShell } from "@/components/marketing-shell";
import { REPOSITORY_URL, SITE_URL } from "@/lib/site";
import { DAILY_SUNRISE_ARTICLE, DAILY_SUNRISE_ARTICLE_URL } from "./content";

const ledgerRows = [
	["Outcome", "One observable result, including what is deliberately out of scope."],
	["Authority", "Allowed repositories, systems, data, tools, and destructive-action boundaries."],
	["Checkpoint", "Last verified state, current owner, and the next safe action."],
	["Evidence", "Source links, commands, receipts, timestamps, and unresolved failures."],
	["Stop rule", "The condition that requires a human decision instead of another retry."],
] as const;

export function DailySunriseArticle() {
	return (
		<MarketingShell>
			<JsonLd
				value={{
					"@context": "https://schema.org",
					"@type": "TechArticle",
					headline: DAILY_SUNRISE_ARTICLE.title,
					description: DAILY_SUNRISE_ARTICLE.description,
					datePublished: DAILY_SUNRISE_ARTICLE.published,
					dateModified: DAILY_SUNRISE_ARTICLE.updated,
					mainEntityOfPage: DAILY_SUNRISE_ARTICLE_URL,
					image: `${SITE_URL}${DAILY_SUNRISE_ARTICLE.imagePath}`,
					author: { "@type": "Organization", name: "Hostplan project", url: REPOSITORY_URL },
					publisher: { "@type": "Organization", name: "Hostplan project", url: SITE_URL },
					citation: DAILY_SUNRISE_ARTICLE.sources.map((source) => source.url),
				}}
			/>
			<article className="mx-auto w-full max-w-4xl px-4 pt-16 sm:px-6 sm:pt-20">
				<nav aria-label="Breadcrumb" className="text-ink-faint text-sm">
					<Link
						className="rounded-sm underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
						href="/examples"
					>
						Examples
					</Link>
					<span aria-hidden="true" className="px-2">
						/
					</span>
					<span>Daily Sunrise</span>
				</nav>
				<header className="mt-8 border-line border-b pb-10">
					<p className="font-mono text-brand text-xs uppercase tracking-[0.18em]">
						Daily Sunrise · field guide
					</p>
					<h1 className="mt-4 max-w-3xl text-balance font-semibold text-4xl text-ink leading-[1.1] tracking-tight sm:text-5xl">
						{DAILY_SUNRISE_ARTICLE.title}
					</h1>
					<p className="mt-6 max-w-2xl text-pretty text-ink-muted text-lg leading-7">
						{DAILY_SUNRISE_ARTICLE.description}
					</p>
					<div className="mt-6 flex flex-wrap gap-x-3 gap-y-2 text-ink-faint text-xs">
						<span>Maintained by the Hostplan project</span>
						<span aria-hidden="true">·</span>
						<time dateTime={DAILY_SUNRISE_ARTICLE.updated}>Updated August 13, 2026</time>
					</div>
				</header>

				<section
					aria-labelledby="answer"
					className="mt-10 rounded-2xl bg-surface-raised p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] sm:p-8"
				>
					<p className="font-mono text-brand text-xs uppercase tracking-[0.16em]">Answer first</p>
					<h2
						id="answer"
						className="mt-3 text-balance font-semibold text-2xl text-ink tracking-tight"
					>
						A resumable session is not yet a resumable job
					</h2>
					<p className="mt-4 max-w-3xl text-pretty text-ink-muted leading-7">
						Use an active-contract ledger: a compact plan block that records the outcome, current
						authority, last verified checkpoint, evidence, and stop rule. Resume the agent session
						for conversational continuity, then re-read the ledger before any action. The session
						preserves context; the ledger preserves permission and truth.
					</p>
				</section>

				<figure className="mt-12 overflow-hidden rounded-2xl bg-surface-raised shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
					<Image
						src={DAILY_SUNRISE_ARTICLE.imagePath}
						alt="Five-part active-contract ledger flowing from outcome and authority through checkpoint and evidence to a stop rule."
						width={1200}
						height={675}
						sizes="(max-width: 896px) 100vw, 896px"
						className="aspect-video h-auto w-full"
						priority
					/>
					<figcaption className="border-line border-t px-4 py-3 text-ink-faint text-xs leading-5 sm:px-6">
						Original Hostplan diagram, August 13, 2026. The five fields travel together across
						sessions.
					</figcaption>
				</figure>

				<div className="mt-16 space-y-16">
					<section aria-labelledby="why-now">
						<h2
							id="why-now"
							className="text-balance font-semibold text-2xl text-ink tracking-tight"
						>
							Why this matters now
						</h2>
						<div className="mt-5 space-y-5 text-pretty text-ink-muted leading-7">
							<p>
								Anthropic published Claude Code v2.1.229 on August 12, 2026. It documents{" "}
								<code className="font-mono text-ink text-sm">claude remote-control --continue</code>{" "}
								for resuming the latest Remote Control session and adds keepalive behavior for long
								thinking pauses. Those are continuity improvements, not a claim that a resumed
								session has fresh authorization or current external state.
							</p>
							<p>
								OpenAI's August 10 Codex guidance for Daybreak work separately recommends an
								isolated environment, explicit engagement scope, least-privilege permissions, and
								review before eligible actions cross the sandbox boundary. Together, the releases
								point to a useful operating rule: restore context, then revalidate the contract.
							</p>
						</div>
					</section>

					<section aria-labelledby="ledger">
						<h2 id="ledger" className="text-balance font-semibold text-2xl text-ink tracking-tight">
							The five-field ledger
						</h2>
						<dl className="mt-6 grid gap-4 sm:grid-cols-2">
							{ledgerRows.map(([term, definition], index) => (
								<div
									key={term}
									className={
										index === ledgerRows.length - 1
											? "rounded-xl bg-surface-raised p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] sm:col-span-2"
											: "rounded-xl bg-surface-raised p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
									}
								>
									<dt className="font-medium text-ink">{term}</dt>
									<dd className="mt-2 text-pretty text-ink-muted text-sm leading-6">
										{definition}
									</dd>
								</div>
							))}
						</dl>
					</section>

					<section aria-labelledby="example">
						<h2
							id="example"
							className="text-balance font-semibold text-2xl text-ink tracking-tight"
						>
							Copyable Hostplan example
						</h2>
						<p className="mt-5 text-pretty text-ink-muted leading-7">
							Keep the ledger short enough to review at every resume. Link evidence; do not paste
							secrets, private URLs, or raw customer content into it.
						</p>
						<pre className="mt-5 overflow-x-auto rounded-xl bg-surface-raised p-5 font-mono text-ink text-sm leading-6 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
							<code>{`## Active contract\n\n- Outcome: Patch the authorized parser and prove the regression is closed.\n- Authority: repo A only; workspace write; no production access.\n- Checkpoint: failing fixture reproduced at commit abc123.\n- Evidence: issue link, failing command, verification receipt.\n- Stop rule: ask before schema, dependency, network, or destructive changes.`}</code>
						</pre>
					</section>

					<section aria-labelledby="workflow">
						<h2
							id="workflow"
							className="text-balance font-semibold text-2xl text-ink tracking-tight"
						>
							Resume workflow
						</h2>
						<ol className="mt-6 space-y-5">
							{(
								[
									[
										"Restore context",
										"Resume the intended session or open the canonical Hostplan URL.",
									],
									[
										"Re-observe",
										"Check branch head, workspace status, external systems, and outstanding reviews.",
									],
									[
										"Revalidate authority",
										"Confirm that the ledger still describes the allowed systems and actions.",
									],
									[
										"Continue one step",
										"Take the next safe action, attach new evidence, and update the checkpoint.",
									],
								] as const
							).map(([title, body], index) => (
								<li key={title} className="grid grid-cols-[2rem_1fr] gap-4">
									<span className="flex size-8 items-center justify-center rounded-full bg-surface-raised font-mono text-brand text-xs tabular-nums shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
										{index + 1}
									</span>
									<div>
										<h3 className="font-medium text-ink">{title}</h3>
										<p className="mt-1 text-pretty text-ink-muted text-sm leading-6">{body}</p>
									</div>
								</li>
							))}
						</ol>
					</section>

					<section aria-labelledby="limits">
						<h2 id="limits" className="text-balance font-semibold text-2xl text-ink tracking-tight">
							What the ledger does not do
						</h2>
						<ul className="mt-5 list-disc space-y-3 pl-5 text-pretty text-ink-muted leading-7 marker:text-brand">
							<li>It does not grant permission; it records permission already granted.</li>
							<li>It does not prove external state is unchanged; re-observation does.</li>
							<li>It does not replace source control, review, tests, or deployment controls.</li>
							<li>It should never contain credentials, private share codes, or customer data.</li>
						</ul>
					</section>

					<section aria-labelledby="sources">
						<h2
							id="sources"
							className="text-balance font-semibold text-2xl text-ink tracking-tight"
						>
							Primary sources
						</h2>
						<ul className="mt-5 space-y-4">
							{DAILY_SUNRISE_ARTICLE.sources.map((source) => (
								<li key={source.url} className="border-line border-l-2 pl-4">
									<a
										className="rounded-sm font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink focus-visible:outline-2 focus-visible:outline-brand"
										href={source.url}
										rel="noreferrer"
										target="_blank"
									>
										{source.name}
									</a>
									<p className="mt-1 text-ink-muted text-sm leading-6">
										{source.dateLabel}. {source.note}
									</p>
								</li>
							))}
						</ul>
					</section>

					<aside className="rounded-2xl bg-surface-raised p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] sm:p-8">
						<h2 className="font-semibold text-xl text-ink">Make the contract durable</h2>
						<p className="mt-3 text-pretty text-ink-muted leading-7">
							Store the plan once, review its lifecycle state, and let the next session retrieve the
							current revision instead of reconstructing intent from chat history.
						</p>
						<div className="mt-5 flex flex-wrap gap-3">
							<Link
								className="flex min-h-11 items-center rounded-lg bg-ink px-4 font-medium text-sm text-surface transition-[background-color,scale] duration-150 hover:bg-white active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
								href="/agent-plan-handoff"
							>
								Read the handoff guide
							</Link>
							<Link
								className="flex min-h-11 items-center rounded-lg px-4 font-medium text-ink-muted text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.12)] transition-[background-color,color,scale] duration-150 hover:bg-surface hover:text-ink active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
								href="/docs/cli"
							>
								Use the CLI
							</Link>
						</div>
					</aside>
				</div>
			</article>
		</MarketingShell>
	);
}
