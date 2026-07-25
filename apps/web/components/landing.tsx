import Image from "next/image";
import type { ReactNode } from "react";
import { CopyCommand } from "@/components/copy-command";

const REPO = "https://github.com/anuragts/hostplan";

const FEATURES: Array<{ title: string; body: string }> = [
	{
		title: "One address per plan",
		body: "Every plan gets a short id and a URL the moment it's stored. Hand the link to a teammate or paste it back to an agent — no more 'which PLAN.md did you mean'.",
	},
	{
		title: "Bucketed by project and branch",
		body: "Project and branch come from git automatically, so plans file themselves. A branch called feat/delivery stays readable as feat/delivery.",
	},
	{
		title: "Public or private, per plan",
		body: "Private by default with a 4-letter share code. Publish a plan when you want a bare link, rotate the code when a link escapes.",
	},
	{
		title: "Open straight into your agent",
		body: "Every plan page hands itself to Codex, Claude Code, or Cursor with the prompt pre-filled — so reading a plan and acting on it are one click apart.",
	},
	{
		title: "Built for agents, not just people",
		body: "--json on every command that returns data, and `hsp get latest` so an agent can re-read what it just wrote without tracking an id.",
	},
	{
		title: "Plain markdown on disk",
		body: "No database, no lock-in. Each plan is a file that describes itself in frontmatter, so the directory tree is the index and nothing can fall out of sync.",
	},
];

const STEPS: Array<{ command: string; caption: string }> = [
	{ command: "hsp add PLAN.md", caption: "Store a plan and get its URL back." },
	{ command: "hsp list", caption: "See what's planned for this repo and branch." },
	{ command: "hsp get latest", caption: "Pull the newest plan back into an agent." },
];

function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
	return <section className={`mx-auto w-full max-w-5xl px-6 ${className}`}>{children}</section>;
}

/**
 * What an anonymous visitor sees at `/`. The owner gets the project index at the
 * same URL — the split is on who is asking, never on NODE_ENV, so both halves
 * stay reachable in development.
 */
export function Landing() {
	return (
		<div className="min-h-dvh">
			<Section className="flex items-center justify-between py-6">
				<span className="font-mono font-semibold text-accent">hostplan</span>
				<a
					href={REPO}
					className="text-ink-muted text-sm transition-colors hover:text-ink"
					target="_blank"
					rel="noreferrer"
				>
					GitHub
				</a>
			</Section>

			<Section className="pt-16 pb-20 sm:pt-24">
				<h1 className="max-w-3xl text-balance font-semibold text-4xl text-ink leading-[1.1] tracking-tight sm:text-6xl">
					A home for the plans your agents write.
				</h1>
				<p className="mt-6 max-w-2xl text-balance text-ink-muted text-lg leading-relaxed">
					Coding agents produce plans constantly, and they land wherever — a scratch file, a
					repo&apos;s PLAN.md, a chat scrollback. hostplan gives every plan one address, filed by
					project and branch, readable in a browser or by the next agent.
				</p>

				<div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
					<CopyCommand command="npx hostplan add PLAN.md" />
					<a
						href={REPO}
						className="text-ink-muted text-sm transition-colors hover:text-ink"
						target="_blank"
						rel="noreferrer"
					>
						or install from source →
					</a>
				</div>
				<p className="mt-3 font-mono text-ink-faint text-xs">
					npm package coming soon — until then, clone the repo and `bun link`.
				</p>
			</Section>

			<Section className="pb-24">
				<div className="overflow-hidden rounded-xl border border-line bg-surface-raised">
					<div className="flex items-center gap-2 border-line border-b px-4 py-3">
						<span className="h-2.5 w-2.5 rounded-full bg-line" />
						<span className="h-2.5 w-2.5 rounded-full bg-line" />
						<span className="h-2.5 w-2.5 rounded-full bg-line" />
					</div>
					<pre className="overflow-x-auto p-6 font-mono text-sm leading-relaxed">
						<code>
							<span className="text-ink-faint">$ </span>
							<span className="text-ink">hsp add PLAN.md</span>
							{"\n"}
							<span className="text-accent">✓</span>
							<span className="text-ink">
								{" "}
								stored{"  "}Worktree GC{"  "}
							</span>
							<span className="text-ink-faint">·</span>
							<span className="text-ink"> nest / feat/delivery </span>
							<span className="text-ink-faint">·</span>
							<span className="text-accent"> a3f9c2</span>
							{"\n"}
							<span className="text-ink-faint">→ </span>
							<span className="text-ink-muted">https://plans.host-plan.com/p/a3f9c2</span>
							<span className="text-ink-faint">{"  "}asks for the code</span>
							{"\n"}
							<span className="text-ink-faint">→ </span>
							<span className="text-ink-muted">https://plans.host-plan.com/p/a3f9c2?code=KRWT</span>
							<span className="text-ink-faint">{"  "}opens directly</span>
						</code>
					</pre>
				</div>
			</Section>

			<Section className="pb-24">
				<div className="overflow-hidden rounded-xl border border-line">
					<Image
						src="/preview.png"
						alt="A plan rendered in the hostplan viewer, with an Open in button"
						width={1600}
						height={1000}
						className="w-full"
						priority
					/>
				</div>
			</Section>

			<Section className="pb-24">
				<h2 className="font-semibold text-2xl text-ink tracking-tight">What it does</h2>
				<div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
					{FEATURES.map((feature) => (
						<div key={feature.title}>
							<h3 className="font-medium text-ink">{feature.title}</h3>
							<p className="mt-2 text-ink-muted text-sm leading-relaxed">{feature.body}</p>
						</div>
					))}
				</div>
			</Section>

			<Section className="pb-28">
				<h2 className="font-semibold text-2xl text-ink tracking-tight">Get started</h2>
				<ol className="mt-8 space-y-5">
					{STEPS.map((step, index) => (
						<li key={step.command} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
							<span className="font-mono text-ink-faint text-sm tabular-nums">{index + 1}</span>
							<code className="rounded-md border border-line bg-surface-raised px-3 py-1.5 font-mono text-ink text-sm">
								{step.command}
							</code>
							<span className="text-ink-muted text-sm">{step.caption}</span>
						</li>
					))}
				</ol>
				<p className="mt-8 text-ink-muted text-sm leading-relaxed">
					Project and branch are detected from git, so there is nothing to configure. Plans are
					private until you publish them.
				</p>
			</Section>

			<footer className="border-line border-t">
				<Section className="flex flex-wrap items-center justify-between gap-4 py-8 text-ink-faint text-sm">
					<span className="font-mono">hostplan</span>
					<span>
						MIT ·{" "}
						<a
							href={REPO}
							className="transition-colors hover:text-ink-muted"
							target="_blank"
							rel="noreferrer"
						>
							source on GitHub
						</a>
					</span>
				</Section>
			</footer>
		</div>
	);
}
