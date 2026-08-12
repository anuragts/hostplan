"use client";

import { useState } from "react";

/** The id is what an agent needs for `hsp get` — make it one click to grab. */
export function CopyId({ id }: { id: string }) {
	const [copied, setCopied] = useState(false);

	return (
		<button
			type="button"
			onClick={() => {
				void navigator.clipboard.writeText(id).then(() => {
					setCopied(true);
					setTimeout(() => setCopied(false), 1200);
				});
			}}
			className="plan-copy-id relative min-h-8 rounded-full bg-surface-raised px-2.5 font-mono text-xs text-ink-muted shadow-[0_0_0_1px_rgba(255,255,255,0.08)] outline-none transition-[background-color,box-shadow,color,scale] duration-150 ease-out after:absolute after:-inset-1 hover:text-ink hover:shadow-[0_0_0_1px_rgba(255,255,255,0.13)] focus-visible:ring-2 focus-visible:ring-brand/40 active:scale-[0.96]"
			title="Copy plan id"
		>
			{copied ? "copied" : id}
		</button>
	);
}
