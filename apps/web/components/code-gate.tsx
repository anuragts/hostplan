import { CODE_LENGTH } from "@hostplan/core";
import { CodeInput } from "@/components/code-input";

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
				<CodeInput
					length={CODE_LENGTH}
					disabled={throttled}
					invalid={wrong && !throttled}
					describedBy={wrong || throttled ? "plan-code-error" : undefined}
				/>
				<div className="min-h-4" aria-live="polite">
					{wrong && !throttled && (
						<p id="plan-code-error" className="text-red-400 text-xs">
							That code doesn&rsquo;t match this plan.
						</p>
					)}
					{throttled && (
						<p id="plan-code-error" className="text-red-400 text-xs tabular-nums">
							Too many attempts. Try again in {retryAfterSeconds}s.
						</p>
					)}
				</div>
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
