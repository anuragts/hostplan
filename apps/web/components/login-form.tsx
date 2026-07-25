"use client";

import { useState } from "react";

/**
 * Magic link only. No passwords: nothing to store, nothing to reset, nothing
 * to leak — and no OAuth app to register before the thing works.
 */
export function LoginForm({ next, error, sent }: { next: string; error?: string; sent: boolean }) {
	const [email, setEmail] = useState("");
	const [busy, setBusy] = useState(false);

	if (sent) {
		return (
			<div>
				<h1 className="font-semibold text-2xl text-ink tracking-tight">Check your email</h1>
				<p className="mt-3 text-ink-muted text-sm leading-relaxed">
					We sent a sign-in link. It expires in an hour, and opening it here finishes the job.
				</p>
			</div>
		);
	}

	return (
		<div>
			<h1 className="font-semibold text-2xl text-ink tracking-tight">Sign in to hostplan</h1>
			<p className="mt-2 text-ink-muted text-sm">
				We'll email you a link — no password to remember.
			</p>

			<form
				action="/api/auth/magic-link"
				method="post"
				onSubmit={() => setBusy(true)}
				className="mt-8 space-y-3"
			>
				<input type="hidden" name="next" value={next} />
				<input
					type="email"
					name="email"
					required
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					placeholder="you@example.com"
					autoComplete="email"
					className="w-full rounded-lg border border-line bg-surface-raised px-3 py-2.5 text-ink text-sm outline-none placeholder:text-ink-faint focus:border-ink-faint"
				/>
				<button
					type="submit"
					disabled={busy}
					className="w-full rounded-lg border border-line bg-surface-raised px-4 py-2.5 font-medium text-ink text-sm transition-colors hover:border-ink-faint disabled:opacity-60"
				>
					{busy ? "Sending…" : "Email me a link"}
				</button>
			</form>

			{error !== undefined && <p className="mt-4 text-red-400 text-sm">{error}</p>}

			<p className="mt-8 text-ink-faint text-xs leading-relaxed">
				Reading a plan someone shared with you doesn&apos;t need an account — just its link and
				4-letter code.
			</p>
		</div>
	);
}
