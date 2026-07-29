import { CODE_LENGTH } from "@hostplan/core";

/**
 * A plain GET form: submitting navigates to `?code=XXXX` on this same page,
 * which is exactly the shareable direct link. Enter the code once and the
 * address bar becomes the thing you can pass on.
 */
export function CodeGate({
	id,
	wrong,
	throttled,
	retryAfterSeconds,
}: {
	id: string;
	wrong: boolean;
	throttled: boolean;
	retryAfterSeconds: number;
}) {
	return (
		<div className="plan-code-gate mx-auto max-w-sm pt-16 pb-24 text-center">
			<h1 className="plan-code-gate-title font-semibold text-2xl text-ink tracking-tight">
				This plan is private
			</h1>
			<p className="plan-code-gate-copy mt-2 text-ink-faint text-sm">
				Enter the {CODE_LENGTH}-letter code from whoever shared it.
			</p>

			<form method="get" className="mt-8 flex flex-col items-center gap-3">
				<input
					name="code"
					// biome-ignore lint/a11y/noAutofocus: the entire page is this one field
					autoFocus
					maxLength={CODE_LENGTH}
					autoComplete="off"
					autoCapitalize="characters"
					spellCheck={false}
					aria-label="Share code"
					disabled={throttled}
					className="plan-code-gate-input w-44 rounded-lg border border-line bg-surface-raised px-3 py-3 text-center font-mono text-ink text-xl uppercase tracking-[0.4em] outline-none placeholder:tracking-normal placeholder:text-ink-faint focus:border-brand disabled:opacity-50"
					placeholder="CODE"
				/>
				{wrong && !throttled && (
					<p className="text-red-400 text-xs">That code doesn&rsquo;t match this plan.</p>
				)}
				{throttled && (
					<p className="text-red-400 text-xs">
						Too many attempts. Try again in {retryAfterSeconds}s.
					</p>
				)}
				<button
					type="submit"
					disabled={throttled}
					className="plan-code-gate-submit rounded-lg bg-brand px-5 py-2.5 font-medium text-sm text-surface transition-[opacity,scale] duration-150 ease-out hover:opacity-90 active:scale-[0.96] disabled:opacity-50"
				>
					Open plan
				</button>
			</form>

			<p className="plan-code-gate-copy mt-8 text-ink-faint text-xs">
				Own this instance?{" "}
				<a href={`/login?next=/p/${id}`} className="plan-code-gate-link text-brand hover:underline">
					Sign in
				</a>{" "}
				to read every plan.
			</p>
		</div>
	);
}
