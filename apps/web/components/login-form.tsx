"use client";

import { useState } from "react";

function GitHubMark() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
			<path
				fill="currentColor"
				d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2 0-.4-.5-1.6.2-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.6 4.7 18.6 5 18.6 5c.7 1.6.2 2.8.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"
			/>
		</svg>
	);
}

/**
 * GitHub for the people this is built for, magic link for everyone else.
 * No passwords: nothing to store, nothing to reset, nothing to leak.
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
			<p className="mt-2 text-ink-muted text-sm">Your plans, filed by project and branch.</p>

			<form action="/api/auth/oauth" method="post" className="mt-8">
				<input type="hidden" name="next" value={next} />
				<button
					type="submit"
					className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-ink px-4 py-2.5 font-medium text-surface text-sm transition-opacity hover:opacity-90"
				>
					<GitHubMark />
					Continue with GitHub
				</button>
			</form>

			<div className="my-6 flex items-center gap-3 text-ink-faint text-xs">
				<span className="h-px flex-1 bg-line" />
				or
				<span className="h-px flex-1 bg-line" />
			</div>

			<form
				action="/api/auth/magic-link"
				method="post"
				onSubmit={() => setBusy(true)}
				className="space-y-3"
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
