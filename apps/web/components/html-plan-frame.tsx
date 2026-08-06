"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";

export function HtmlPlanFrame({ src, title }: { src: string; title: string }) {
	const [state, setState] = useState<"loading" | "ready" | "error">("loading");

	return (
		<div className="plan-html-viewer">
			<div className="plan-html-toolbar print:hidden">
				<span aria-live="polite" className="text-ink-faint text-xs">
					{state === "loading"
						? "Loading custom document…"
						: state === "error"
							? "Document failed to load"
							: "Custom document"}
				</span>
				<a
					href={src}
					target="_blank"
					rel="noreferrer"
					className="plan-html-full-view inline-flex min-h-10 items-center gap-2 rounded-md px-3 font-medium text-ink-muted text-xs outline-none transition-[color,background-color,scale] duration-150 hover:bg-white/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/40 active:scale-[0.96]"
				>
					Open full view
					<ExternalLink aria-hidden className="size-3.5" />
				</a>
			</div>
			<div className="plan-html-frame-shell">
				{state === "loading" && (
					<div className="plan-html-loading" aria-hidden>
						<div className="h-5 w-48 animate-pulse rounded bg-white/8" />
						<div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
							{[0, 1, 2, 3].map((item) => (
								<div key={item} className="h-24 animate-pulse rounded-lg bg-white/5" />
							))}
						</div>
					</div>
				)}
				{state === "error" && (
					<div className="plan-html-error" role="alert">
						<p className="font-medium text-ink">The custom document could not be displayed.</p>
						<p className="mt-1 text-ink-muted text-sm">Open the full view or try again.</p>
					</div>
				)}
				<iframe
					src={src}
					title={title}
					sandbox=""
					referrerPolicy="no-referrer"
					onLoad={() => setState("ready")}
					onError={() => setState("error")}
					className="plan-html-frame"
					data-state={state}
				/>
			</div>
		</div>
	);
}
