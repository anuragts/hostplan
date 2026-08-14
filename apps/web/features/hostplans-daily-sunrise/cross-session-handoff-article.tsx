import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { MarketingShell } from "@/components/marketing-shell";
import { REPOSITORY_URL, SITE_URL } from "@/lib/site";
import { CROSS_SESSION_HANDOFF_ARTICLE, CROSS_SESSION_HANDOFF_ARTICLE_URL } from "./content";

const handoffFields = [
	[
		"Pointer",
		"The canonical plan URL or id. Never include a private share code in a public channel.",
	],
	["State", "Working, blocked, or done, followed by the last verified UTC timestamp."],
	["Delta", "Only what changed since the receiver last read the plan."],
	["Next action", "One scoped action the receiving session can safely take."],
	["Stop condition", "The decision or state change that must return to a human."],
] as const;

const receiverChecks = [
	["Resolve the pointer", "Open the named plan and confirm it is the intended project and branch."],
	[
		"Re-observe state",
		"Compare the plan checkpoint with the workspace, pull request, and external systems.",
	],
	[
		"Revalidate authority",
		"Confirm the receiving session is allowed to use the named tools and data.",
	],
	[
		"Acknowledge one action",
		"Reply with the verified checkpoint and the single next action before editing.",
	],
] as const;

export function CrossSessionHandoffArticle() {
	return (
		<MarketingShell>
			<JsonLd
				value={{
					"@context": "https://schema.org",
					"@type": "TechArticle",
					headline: CROSS_SESSION_HANDOFF_ARTICLE.title,
					description: CROSS_SESSION_HANDOFF_ARTICLE.description,
					datePublished: CROSS_SESSION_HANDOFF_ARTICLE.published,
					dateModified: CROSS_SESSION_HANDOFF_ARTICLE.updated,
					mainEntityOfPage: CROSS_SESSION_HANDOFF_ARTICLE_URL,
					image: SITE_URL + CROSS_SESSION_HANDOFF_ARTICLE.imagePath,
					author: { "@type": "Organization", name: "Hostplan project", url: REPOSITORY_URL },
					publisher: { "@type": "Organization", name: "Hostplan project", url: SITE_URL },
					citation: CROSS_SESSION_HANDOFF_ARTICLE.sources.map((source) => source.url),
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
						{CROSS_SESSION_HANDOFF_ARTICLE.title}
					</h1>
					<p className="mt-6 max-w-2xl text-pretty text-ink-muted text-lg leading-7">
						{CROSS_SESSION_HANDOFF_ARTICLE.description}
					</p>
					<div className="mt-6 flex flex-wrap gap-x-3 gap-y-2 text-ink-faint text-xs">
						<span>Maintained by the Hostplan project</span>
						<span aria-hidden="true">·</span>
						<time dateTime={CROSS_SESSION_HANDOFF_ARTICLE.updated}>Updated August 14, 2026</time>
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
						Use the message as an interrupt, not the artifact
					</h2>
					<p className="mt-4 max-w-3xl text-pretty text-ink-muted leading-7">
						A cross-session message should wake the right agent and point it to one canonical plan.
						It should not carry the full transcript, permission history, or mutable project state.
						The receiving session opens the plan, re-observes the workspace, revalidates authority,
						and acknowledges one next action before it edits anything.
					</p>
				</section>

				<figure className="mt-12 overflow-hidden rounded-2xl bg-surface-raised shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
					<Image
						src={CROSS_SESSION_HANDOFF_ARTICLE.imagePath}
						alt="A short message from one coding-agent session points through a durable Hostplan artifact to a receiving session that verifies state before acting."
						width={1200}
						height={675}
						sizes="(max-width: 896px) 100vw, 896px"
						className="aspect-video h-auto w-full -outline-offset-1 outline outline-1 outline-black/10 dark:outline-white/10"
						priority
					/>
					<figcaption className="border-line border-t px-4 py-3 text-pretty text-ink-faint text-xs leading-5 sm:px-6">
						Original Hostplan diagram, August 14, 2026. The message routes attention; the artifact
						carries durable state.
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
								Anthropic published Claude Code v2.1.232 on August 13, 2026 at 23:29 UTC. The
								release lets a user mention another named Claude session and lets{" "}
								<code className="font-mono text-ink text-sm">SendMessage</code> deliver directly
								when one live session exactly matches that name.
							</p>
							<p>
								That improves reachability between live sessions. It does not make a message a
								durable project record, prove that the receiver sees current repository state, or
								transfer authority. Anthropic&apos;s session documentation separately ties
								conversations to projects and worktrees, which is why the receiver still has to
								resolve and verify its context.
							</p>
						</div>
					</section>

					<section aria-labelledby="envelope">
						<h2
							id="envelope"
							className="text-balance font-semibold text-2xl text-ink tracking-tight"
						>
							The five-line handoff envelope
						</h2>
						<p className="mt-5 text-pretty text-ink-muted leading-7">
							Keep the message small enough to audit at a glance. The plan owns the long-form
							context; the envelope only identifies what the receiver should verify next.
						</p>
						<dl className="mt-6 grid gap-4 sm:grid-cols-2">
							{handoffFields.map(([term, definition], index) => (
								<div
									key={term}
									className={
										index === handoffFields.length - 1
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
							Copyable message
						</h2>
						<pre className="mt-5 overflow-x-auto rounded-xl bg-surface-raised p-5 font-mono text-ink text-sm leading-6 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
							<code>
								{
									"HANDOFF\nPlan: https://plans.host-plan.com/p/<id>\nState: blocked · verified 2026-08-14T11:40:00Z\nDelta: CI is green; one review thread remains open.\nNext: read the plan, verify the PR head, then answer that thread.\nStop: ask before changing scope, dependencies, or deployment state."
								}
							</code>
						</pre>
						<p className="mt-4 text-pretty text-ink-faint text-sm leading-6">
							Use the bare public URL only for a deliberately public plan. Keep private share codes,
							credentials, customer data, and raw authenticated URLs out of messages and logs.
						</p>
					</section>

					<section aria-labelledby="receiver">
						<h2
							id="receiver"
							className="text-balance font-semibold text-2xl text-ink tracking-tight"
						>
							Receiver protocol
						</h2>
						<ol className="mt-6 space-y-5">
							{receiverChecks.map(([title, body], index) => (
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

					<section aria-labelledby="failure-modes">
						<h2
							id="failure-modes"
							className="text-balance font-semibold text-2xl text-ink tracking-tight"
						>
							Three failure modes to avoid
						</h2>
						<ul className="mt-5 list-disc space-y-3 pl-5 text-pretty text-ink-muted leading-7 marker:text-brand">
							<li>Transcript dumping hides the one state change the receiver actually needs.</li>
							<li>
								A copied plan becomes stale as soon as either session updates a different copy.
							</li>
							<li>
								A successful delivery says nothing about branch ownership, permission, or freshness.
							</li>
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
							{CROSS_SESSION_HANDOFF_ARTICLE.sources.map((source) => (
								<li key={source.url} className="border-line border-l-2 pl-4">
									<a
										className="rounded-sm font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink focus-visible:outline-2 focus-visible:outline-brand"
										href={source.url}
										rel="noreferrer"
										target="_blank"
									>
										{source.name}
									</a>
									<p className="mt-1 text-pretty text-ink-muted text-sm leading-6">
										{source.dateLabel}. {source.note}
									</p>
								</li>
							))}
						</ul>
					</section>

					<aside className="rounded-2xl bg-surface-raised p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] sm:p-8">
						<h2 className="text-balance font-semibold text-xl text-ink">
							Give every session the same source of truth
						</h2>
						<p className="mt-3 text-pretty text-ink-muted leading-7">
							Store the plan once, update it in place, and let messages carry only the pointer and
							fresh delta. That keeps human review possible even when sessions come and go.
						</p>
						<div className="mt-5 flex flex-wrap gap-3">
							<Link
								className="flex min-h-11 items-center rounded-lg bg-ink px-4 font-medium text-sm text-surface transition-[background-color,scale] duration-150 hover:bg-white active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
								href="/agent-plan-handoff"
							>
								Read the handoff guide
							</Link>
							<Link
								className="flex min-h-11 items-center rounded-lg px-4 font-medium text-ink-muted text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.12)] transition-[background-color,color,scale] duration-150 hover:bg-surface hover:text-ink active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
								href="/docs/agent-setup"
							>
								Set up an agent
							</Link>
						</div>
					</aside>
				</div>
			</article>
		</MarketingShell>
	);
}
