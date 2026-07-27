"use client";

import posthog from "posthog-js";
import { useState } from "react";

/** The one thing a visitor is meant to leave with, so it's one click to take. */
export function CopyCommand({
	command,
	event = "install_command_copied",
}: {
	command: string;
	event?: string;
}) {
	const [copied, setCopied] = useState(false);

	return (
		<button
			type="button"
			onClick={() => {
				void navigator.clipboard.writeText(command).then(() => {
					posthog.capture(event);
					setCopied(true);
					setTimeout(() => setCopied(false), 1400);
				});
			}}
			className="group flex w-full items-center gap-3 rounded-xl bg-surface-raised px-5 py-4 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-[box-shadow,scale] duration-150 ease-out hover:shadow-[0_0_0_1px_rgba(255,255,255,0.13)] active:scale-[0.96] sm:w-auto"
		>
			<span className="select-none font-mono text-brand text-sm">$</span>
			<code className="flex-1 font-mono text-ink text-sm sm:text-base">{command}</code>
			<span className="ml-2 shrink-0 font-mono text-ink-faint text-xs transition-colors group-hover:text-ink-muted">
				{copied ? "copied" : "copy"}
			</span>
		</button>
	);
}
