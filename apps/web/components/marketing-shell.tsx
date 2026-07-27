import Link from "next/link";
import type { ReactNode } from "react";
import { TrackedLink } from "@/components/tracked-link";
import { REPOSITORY_URL } from "@/lib/site";

const NAVIGATION = [
	{ href: "/coding-agent-plans", label: "How it works" },
	{ href: "/examples", label: "Examples" },
	{ href: "/docs/cli", label: "Docs" },
] as const;

export function MarketingShell({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-dvh">
			<header className="mx-auto flex min-h-16 w-full max-w-6xl items-center gap-5 px-6">
				<Link
					href="/"
					className="font-mono font-semibold text-brand transition-opacity hover:opacity-70"
				>
					hostplan
				</Link>
				<nav aria-label="Primary" className="ml-auto hidden items-center gap-1 sm:flex">
					{NAVIGATION.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className="flex min-h-10 items-center rounded-lg px-3 text-ink-muted text-sm transition-colors hover:bg-surface-raised hover:text-ink"
						>
							{item.label}
						</Link>
					))}
					<TrackedLink
						event="marketing_github_clicked"
						href={REPOSITORY_URL}
						target="_blank"
						rel="noreferrer"
						className="flex min-h-10 items-center rounded-lg px-3 text-ink-muted text-sm transition-colors hover:bg-surface-raised hover:text-ink"
					>
						GitHub
					</TrackedLink>
				</nav>
				<TrackedLink
					event="marketing_sign_in_clicked"
					href="/login"
					className="ml-auto flex min-h-10 items-center rounded-lg bg-ink px-4 font-medium text-sm text-surface transition-[background-color,scale] duration-150 ease-out hover:bg-white active:scale-[0.96] sm:ml-2"
				>
					Sign in
				</TrackedLink>
			</header>
			<main>{children}</main>
			<footer className="mt-24 border-line border-t">
				<div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 sm:grid-cols-[1.2fr_2fr]">
					<div>
						<Link href="/" className="font-mono font-semibold text-brand">
							hostplan
						</Link>
						<p className="mt-3 max-w-xs text-pretty text-ink-faint text-sm leading-relaxed">
							A home for coding-agent plans: local-first, shareable when needed, and readable by
							people or agents.
						</p>
					</div>
					<div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
						<FooterGroup
							title="Learn"
							links={[
								["Coding-agent plans", "/coding-agent-plans"],
								["Plan handoffs", "/agent-plan-handoff"],
								["PLAN.md comparison", "/compare/plan-md-vs-hostplan"],
							]}
						/>
						<FooterGroup
							title="Use"
							links={[
								["Examples", "/examples"],
								["CLI reference", "/docs/cli"],
								["Agent setup", "/docs/agent-setup"],
							]}
						/>
						<FooterGroup
							title="Project"
							links={[
								["About", "/about"],
								["GitHub", REPOSITORY_URL],
								["Sign in", "/login"],
							]}
						/>
					</div>
				</div>
			</footer>
		</div>
	);
}

function FooterGroup({
	title,
	links,
}: {
	title: string;
	links: ReadonlyArray<readonly [label: string, href: string]>;
}) {
	return (
		<div>
			<h2 className="font-medium text-ink">{title}</h2>
			<ul className="mt-3 space-y-2.5">
				{links.map(([label, href]) => (
					<li key={href}>
						<Link href={href} className="text-ink-faint transition-colors hover:text-ink">
							{label}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
