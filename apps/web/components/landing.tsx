import Image from "next/image";
import Link from "next/link";
import { CopyCommand } from "@/components/copy-command";
import { JsonLd } from "@/components/json-ld";
import { MarketingShell } from "@/components/marketing-shell";
import { TrackedLink } from "@/components/tracked-link";
import { HOME_JSON_LD, REPOSITORY_URL } from "@/lib/site";

const FEATURES = [
	{
		title: "One address per plan",
		body: "Every plan gets a short id and a durable URL. Teammates and agents can refer to the same artifact without hunting through chat history.",
	},
	{
		title: "Project and branch context",
		body: "Hostplan reads git context automatically, so the plan for feat/delivery stays attached to feat/delivery instead of becoming another mystery PLAN.md.",
	},
	{
		title: "Local first, shareable by choice",
		body: "Plans are plain Markdown on your machine. Sign in to a deployment when you want private coded links or intentionally public plans.",
	},
	{
		title: "Open in your coding agent",
		body: "A plan page can prepare a new thread in Codex, Claude Code, or Cursor. You review the prompt before anything is sent.",
	},
	{
		title: "Machine-readable by default",
		body: "Browsers get the rendered viewer. curl and text clients get the original plan source from the exact same URL.",
	},
	{
		title: "A workflow, not a file dump",
		body: "Draft, approve, execute, and complete plans; split large work into ordered stacks; and check off addressable tasks as work lands.",
	},
] as const;

const WORKFLOW = [
	["Store", "hsp add PLAN.md", "Hostplan files the plan under the current project and branch."],
	["Share", "hsp share <id>", "Send a private coded link or deliberately publish the plan."],
	["Resume", "hsp get latest", "The next coding-agent session reads the same source of truth."],
	["Execute", "Open in Codex", "Hand the reviewed plan into the agent that will implement it."],
] as const;

const LEARN_LINKS = [
	{
		href: "/coding-agent-plans",
		title: "What is a coding-agent plan?",
		body: "The role of a durable plan between a request and implementation.",
	},
	{
		href: "/agent-plan-handoff",
		title: "Agent plan handoffs",
		body: "Move work between sessions, tools, teammates, and coding agents.",
	},
	{
		href: "/compare/plan-md-vs-hostplan",
		title: "Hostplan vs. PLAN.md",
		body: "When a checked-in file is enough—and when it starts to break down.",
	},
	{
		href: "/examples",
		title: "Runnable examples",
		body: "Lifecycle, stacks, task tracking, and cross-agent handoffs.",
	},
] as const;

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
	return <section className={`mx-auto w-full max-w-6xl px-6 ${className}`}>{children}</section>;
}

export function Landing() {
	return (
		<MarketingShell>
			<JsonLd value={HOME_JSON_LD} />

			<Section className="pt-20 pb-20 sm:pt-28">
				<p className="font-mono text-brand text-xs uppercase tracking-[0.18em]">
					A durable handoff layer for coding agents
				</p>
				<h1 className="mt-5 max-w-4xl text-balance font-semibold text-5xl text-ink leading-[1.02] tracking-[-0.04em] sm:text-7xl">
					A home for the plans your coding agents write.
				</h1>
				<p className="mt-7 max-w-2xl text-pretty text-ink-muted text-lg leading-relaxed sm:text-xl">
					Hostplan is an open-source CLI and web viewer that gives every coding-agent plan a stable,
					shareable, machine-readable URL. Keep plans local, hand them to a teammate, or open them
					directly in Codex, Claude Code, and Cursor.
				</p>

				<div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
					<CopyCommand command="bun add --global hostplan" />
					<TrackedLink
						event="marketing_github_clicked"
						href={REPOSITORY_URL}
						target="_blank"
						rel="noreferrer"
						className="flex min-h-11 items-center px-2 text-ink-muted text-sm transition-colors hover:text-ink"
					>
						View the open-source repository →
					</TrackedLink>
				</div>
				<p className="mt-3 max-w-xl text-pretty font-mono text-ink-faint text-xs">
					Requires Bun and Node 20+. You can also use `npm install --global hostplan`; the CLI still
					runs with Bun.
				</p>
			</Section>

			<Section className="pb-24">
				<div className="overflow-hidden rounded-2xl bg-surface-raised shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_18px_60px_rgba(0,0,0,0.22)]">
					<div className="flex items-center gap-2 border-line border-b px-5 py-4">
						<span className="size-2.5 rounded-full bg-line" />
						<span className="size-2.5 rounded-full bg-line" />
						<span className="size-2.5 rounded-full bg-line" />
						<span className="ml-auto font-mono text-ink-faint text-xs">terminal</span>
					</div>
					<pre className="overflow-x-auto p-6 font-mono text-sm leading-relaxed sm:p-8">
						<code>
							<span className="text-ink-faint">$ </span>
							<span className="text-ink">hsp add PLAN.md</span>
							{"\n"}
							<span className="text-brand">✓</span>
							<span className="text-ink"> stored Worktree GC </span>
							<span className="text-ink-faint">· nest / feat/delivery · </span>
							<span className="text-brand">a3f9c2</span>
							{"\n"}
							<span className="text-ink-faint">→ </span>
							<span className="text-ink-muted">https://plans.host-plan.com/p/a3f9c2</span>
							{"\n\n"}
							<span className="text-ink-faint">$ </span>
							<span className="text-ink">curl -fsSL https://plans.host-plan.com/p/a3f9c2</span>
							{"\n"}
							<span className="text-ink-faint"># Worktree GC</span>
							{"\n"}
							<span className="text-ink-faint">...</span>
						</code>
					</pre>
				</div>
			</Section>

			<Section className="pb-24">
				<div className="overflow-hidden rounded-2xl bg-surface-raised shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
					<Image
						src="/preview.png"
						alt="A coding-agent implementation plan rendered in Hostplan, with an Open in agent button"
						width={1600}
						height={1000}
						className="w-full outline -outline-offset-1 outline-1 outline-white/10"
						priority
					/>
				</div>
			</Section>

			<Section className="pb-24">
				<div className="max-w-2xl">
					<p className="font-mono text-brand text-xs uppercase tracking-[0.18em]">Why Hostplan</p>
					<h2 className="mt-3 text-balance font-semibold text-3xl text-ink tracking-tight">
						The plan survives the chat that created it.
					</h2>
					<p className="mt-4 text-pretty text-ink-muted leading-7">
						Coding-agent plans often disappear into a scratch file, a temporary worktree, or last
						week&apos;s conversation. Hostplan gives the planning artifact an identity, context,
						lifecycle, and retrieval path of its own.
					</p>
				</div>
				<div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
					{FEATURES.map((feature) => (
						<div key={feature.title}>
							<h3 className="font-medium text-ink">{feature.title}</h3>
							<p className="mt-2 text-pretty text-ink-muted text-sm leading-relaxed">
								{feature.body}
							</p>
						</div>
					))}
				</div>
			</Section>

			<Section className="pb-24">
				<div className="rounded-2xl bg-surface-raised p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] sm:p-10">
					<p className="font-mono text-brand text-xs uppercase tracking-[0.18em]">
						One continuous workflow
					</p>
					<h2 className="mt-3 text-balance font-semibold text-3xl text-ink tracking-tight">
						Store once. Resume anywhere.
					</h2>
					<ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{WORKFLOW.map(([title, command, body], index) => (
							<li key={title}>
								<span className="font-mono text-brand text-xs tabular-nums">0{index + 1}</span>
								<h3 className="mt-3 font-medium text-ink">{title}</h3>
								<code className="mt-2 block font-mono text-ink-muted text-xs">{command}</code>
								<p className="mt-3 text-pretty text-ink-faint text-sm leading-6">{body}</p>
							</li>
						))}
					</ol>
				</div>
			</Section>

			<Section className="pb-24">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<p className="font-mono text-brand text-xs uppercase tracking-[0.18em]">Learn</p>
						<h2 className="mt-3 text-balance font-semibold text-3xl text-ink tracking-tight">
							Build a better plan handoff.
						</h2>
					</div>
					<Link href="/docs/cli" className="text-ink-muted text-sm hover:text-ink">
						Read the CLI reference →
					</Link>
				</div>
				<div className="mt-8 grid gap-4 sm:grid-cols-2">
					{LEARN_LINKS.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className="rounded-xl bg-surface-raised p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-[box-shadow,scale] duration-150 ease-out hover:shadow-[0_0_0_1px_rgba(255,255,255,0.13)] active:scale-[0.96]"
						>
							<h3 className="font-medium text-ink">{item.title}</h3>
							<p className="mt-2 text-pretty text-ink-muted text-sm leading-6">{item.body}</p>
						</Link>
					))}
				</div>
			</Section>

			<Section className="pb-8">
				<div className="rounded-2xl bg-brand px-6 py-12 text-surface sm:px-10">
					<h2 className="max-w-2xl text-balance font-semibold text-3xl tracking-tight">
						Give your next coding-agent plan a durable address.
					</h2>
					<p className="mt-4 max-w-xl text-pretty text-surface/75 leading-7">
						Clone the repository, link the CLI, and store your first plan locally. Nothing leaves
						your machine until you choose a deployment.
					</p>
					<TrackedLink
						event="marketing_github_clicked"
						href={REPOSITORY_URL}
						target="_blank"
						rel="noreferrer"
						className="mt-7 inline-flex min-h-11 items-center rounded-lg bg-surface px-4 font-medium text-ink text-sm transition-[background-color,scale] duration-150 ease-out hover:bg-surface-raised active:scale-[0.96]"
					>
						Get Hostplan on GitHub
					</TrackedLink>
				</div>
			</Section>
		</MarketingShell>
	);
}
