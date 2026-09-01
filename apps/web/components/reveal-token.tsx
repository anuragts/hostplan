"use client";

import { useEffect, useState } from "react";

/** Shown once. Only the hash is stored, so there is no second chance to copy it. */
export function RevealToken() {
	const [token, setToken] = useState<string>();
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		const params = new URLSearchParams(window.location.hash.slice(1));
		const created = params.get("created");
		if (created === null) return;
		setToken(created);
		// The fragment never reaches the server; remove it after capture so it is
		// not retained in browser history or copied with the page URL.
		window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
	}, []);

	if (token === undefined) return null;

	return (
		<div className="mb-8 rounded-lg border border-brand/40 bg-surface-raised p-4">
			<p className="font-medium text-ink text-sm">Copy this now — it won&apos;t be shown again.</p>
			<button
				type="button"
				onClick={() => {
					void navigator.clipboard.writeText(token).then(() => {
						setCopied(true);
						setTimeout(() => setCopied(false), 1400);
					});
				}}
				className="mt-3 flex w-full items-center gap-3 rounded-md border border-line bg-surface px-3 py-2 text-left"
			>
				<code className="min-w-0 flex-1 truncate font-mono text-ink text-xs">{token}</code>
				<span className="shrink-0 font-mono text-ink-faint text-xs">
					{copied ? "copied" : "copy"}
				</span>
			</button>
			<p className="mt-3 font-mono text-ink-faint text-xs">
				hsp login --token {token.slice(0, 12)}…
			</p>
		</div>
	);
}
