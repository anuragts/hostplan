import Link from "next/link";
import type { ReactNode } from "react";

export interface Crumb {
	label: string;
	href?: string;
}

export function Shell({ crumbs, children }: { crumbs: Crumb[]; children: ReactNode }) {
	return (
		<div className="mx-auto min-h-dvh w-full max-w-4xl px-6 py-10">
			<header className="mb-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
				<Link
					href="/"
					className="font-mono font-semibold text-accent transition-opacity hover:opacity-70"
				>
					hostplan
				</Link>
				{crumbs.map((crumb) => (
					<span key={`${crumb.label}-${crumb.href ?? ""}`} className="flex items-center gap-2">
						<span className="text-ink-faint">/</span>
						{crumb.href === undefined ? (
							<span className="text-ink-muted">{crumb.label}</span>
						) : (
							<Link href={crumb.href} className="text-ink-muted transition-colors hover:text-ink">
								{crumb.label}
							</Link>
						)}
					</span>
				))}
			</header>
			{children}
		</div>
	);
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
	return (
		<div className="mb-8">
			<h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
			{subtitle !== undefined && <p className="mt-1 text-sm text-ink-faint">{subtitle}</p>}
		</div>
	);
}

export function Empty({ message, hint }: { message: string; hint?: string }) {
	return (
		<div className="rounded-lg border border-dashed border-line px-6 py-12 text-center">
			<p className="text-sm text-ink-muted">{message}</p>
			{hint !== undefined && <p className="mt-2 font-mono text-xs text-ink-faint">{hint}</p>}
		</div>
	);
}

/** A row in one of the index lists — projects, branches, or plans. */
export function Row({
	href,
	title,
	meta,
	trailing,
}: {
	href: string;
	title: ReactNode;
	meta?: ReactNode;
	trailing?: ReactNode;
}) {
	return (
		<Link
			href={href}
			className="group flex items-center gap-4 rounded-lg border border-line bg-surface-raised/40 px-4 py-3 transition-colors hover:border-ink-faint hover:bg-surface-raised"
		>
			<div className="min-w-0 flex-1">
				<div className="truncate text-sm font-medium text-ink">{title}</div>
				{meta !== undefined && <div className="mt-0.5 truncate text-xs text-ink-faint">{meta}</div>}
			</div>
			{trailing !== undefined && (
				<div className="shrink-0 font-mono text-xs text-ink-faint">{trailing}</div>
			)}
		</Link>
	);
}
