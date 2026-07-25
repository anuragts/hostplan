"use client";

import { useState } from "react";

/** The one thing a visitor is meant to leave with, so it's one click to take. */
export function CopyCommand({ command }: { command: string }) {
	const [copied, setCopied] = useState(false);

	return (
		<button
			type="button"
			onClick={() => {
				void navigator.clipboard.writeText(command).then(() => {
					setCopied(true);
					setTimeout(() => setCopied(false), 1400);
				});
			}}
			className="group flex w-full items-center gap-3 rounded-xl border border-line bg-surface-raised px-5 py-4 text-left transition-colors hover:border-ink-faint sm:w-auto"
		>
			<span className="select-none font-mono text-accent text-sm">$</span>
			<code className="flex-1 font-mono text-ink text-sm sm:text-base">{command}</code>
			<span className="ml-2 shrink-0 font-mono text-ink-faint text-xs transition-colors group-hover:text-ink-muted">
				{copied ? "copied" : "copy"}
			</span>
		</button>
	);
}
