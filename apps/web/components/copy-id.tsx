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
			className="plan-copy-id rounded border border-line bg-surface-raised px-2 py-0.5 font-mono text-xs text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
			title="Copy plan id"
		>
			{copied ? "copied" : id}
		</button>
	);
}
