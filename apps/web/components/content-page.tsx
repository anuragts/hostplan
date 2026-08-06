import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/json-ld";
import { MarketingShell } from "@/components/marketing-shell";
import { absoluteUrl, REPOSITORY_URL, SITE_UPDATED } from "@/lib/site";

export function ContentPage({
	path,
	eyebrow,
	title,
	description,
	children,
	related,
}: {
	path: string;
	eyebrow: string;
	title: string;
	description: string;
	children: ReactNode;
	related?: ReadonlyArray<readonly [label: string, href: string]>;
}) {
	return (
		<MarketingShell>
			<JsonLd
				value={{
					"@context": "https://schema.org",
					"@type": "BreadcrumbList",
					itemListElement: [
						{
							"@type": "ListItem",
							position: 1,
							name: "Hostplan",
							item: absoluteUrl("/"),
						},
						{
							"@type": "ListItem",
							position: 2,
							name: title,
							item: absoluteUrl(path),
						},
					],
				}}
			/>
			<article className="mx-auto w-full max-w-3xl px-6 pt-20">
				<header className="border-line border-b pb-10">
					<p className="font-mono text-brand text-xs uppercase tracking-[0.18em]">{eyebrow}</p>
					<h1 className="mt-4 text-balance font-semibold text-4xl text-ink leading-[1.08] tracking-tight sm:text-5xl">
						{title}
					</h1>
					<p className="mt-6 max-w-2xl text-pretty text-ink-muted text-lg leading-relaxed">
						{description}
					</p>
					<div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-faint text-xs">
						<span>Maintained by the Hostplan project</span>
						<span aria-hidden="true">·</span>
						<time dateTime={SITE_UPDATED}>Updated August 6, 2026</time>
						<span aria-hidden="true">·</span>
						<a
							href={REPOSITORY_URL}
							target="_blank"
							rel="noreferrer"
							className="underline decoration-line underline-offset-4 transition-colors hover:text-ink"
						>
							View source
						</a>
					</div>
				</header>
				<div className="content-page mt-12 space-y-16">{children}</div>
				{related !== undefined && (
					<aside className="mt-16 border-line border-t pt-8">
						<h2 className="font-medium text-ink">Keep reading</h2>
						<div className="mt-4 grid gap-3 sm:grid-cols-2">
							{related.map(([label, href]) => (
								<Link
									key={href}
									href={href}
									className="rounded-xl bg-surface-raised p-4 text-ink-muted text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-[box-shadow,color,scale] duration-150 ease-out hover:text-ink hover:shadow-[0_0_0_1px_rgba(255,255,255,0.13)] active:scale-[0.96]"
								>
									{label} <span aria-hidden="true">→</span>
								</Link>
							))}
						</div>
					</aside>
				)}
			</article>
		</MarketingShell>
	);
}

export function ContentSection({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section>
			<h2 className="text-balance font-semibold text-2xl text-ink tracking-tight">{title}</h2>
			<div className="mt-5 space-y-5 text-pretty text-ink-muted leading-7">{children}</div>
		</section>
	);
}

export function CardGrid({ children }: { children: ReactNode }) {
	return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function InfoCard({ title, children }: { title: string; children: ReactNode }) {
	return (
		<div className="rounded-xl bg-surface-raised p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
			<h3 className="font-medium text-ink">{title}</h3>
			<div className="mt-2 text-pretty text-ink-muted text-sm leading-6">{children}</div>
		</div>
	);
}

export function Command({ children }: { children: string }) {
	return (
		<pre className="overflow-x-auto rounded-xl bg-surface-raised p-5 font-mono text-ink text-sm leading-6 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
			<code>{children}</code>
		</pre>
	);
}

export function Steps({ items }: { items: ReadonlyArray<readonly [title: string, body: string]> }) {
	return (
		<ol className="space-y-5">
			{items.map(([title, body], index) => (
				<li key={title} className="grid grid-cols-[2rem_1fr] gap-3">
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
	);
}

export function ComparisonTable({
	headers,
	rows,
}: {
	headers: readonly [string, string, string];
	rows: ReadonlyArray<readonly [string, string, string]>;
}) {
	return (
		<div className="overflow-x-auto rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
			<table className="w-full min-w-[38rem] border-collapse text-left text-sm">
				<thead className="bg-surface-raised text-ink">
					<tr>
						{headers.map((header) => (
							<th key={header} className="px-4 py-3 font-medium">
								{header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr key={row[0]} className="border-line border-t align-top">
							{row.map((cell, index) => (
								<td
									key={cell}
									className={`px-4 py-3 ${index === 0 ? "text-ink" : "text-ink-muted"}`}
								>
									{cell}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
