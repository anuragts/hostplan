"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Token {
	id: string;
	name: string;
	created_at: string;
	last_used_at: string | null;
}

export function TokenList({ tokens }: { tokens: Token[] }) {
	const router = useRouter();
	const [busy, setBusy] = useState<string | undefined>();

	if (tokens.length === 0) {
		return <p className="text-ink-faint text-sm">No tokens yet.</p>;
	}

	return (
		<ul className="divide-y divide-line border-line border-t">
			{tokens.map((token) => (
				<li key={token.id} className="flex items-center justify-between gap-4 py-3">
					<div className="min-w-0">
						<p className="truncate text-ink text-sm">{token.name}</p>
						<p className="text-ink-faint text-xs">
							created {new Date(token.created_at).toLocaleDateString()} ·{" "}
							{token.last_used_at === null
								? "never used"
								: `last used ${new Date(token.last_used_at).toLocaleDateString()}`}
						</p>
					</div>
					<button
						type="button"
						disabled={busy === token.id}
						onClick={() => {
							setBusy(token.id);
							void fetch("/api/tokens", {
								method: "DELETE",
								headers: { "content-type": "application/json" },
								body: JSON.stringify({ id: token.id }),
							}).then(() => router.refresh());
						}}
						className="shrink-0 text-red-400 text-sm transition-opacity hover:opacity-70 disabled:opacity-50"
					>
						Revoke
					</button>
				</li>
			))}
		</ul>
	);
}
