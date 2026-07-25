import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { Shell } from "@/components/shell";
import { authEnabled } from "@/lib/auth";
import { currentViewer } from "@/lib/current-viewer";
import { accountsEnabled } from "@/lib/supabase-clients";

export const dynamic = "force-dynamic";

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ next?: string; error?: string; sent?: string }>;
}) {
	const { next = "/", error, sent } = await searchParams;

	// Already signed in — nothing here to do.
	if ((await currentViewer()).kind !== "anonymous") redirect(next);

	// Accounts take precedence when configured; the token form is what a
	// single-owner deployment still gets.
	if (accountsEnabled()) {
		return (
			<Shell crumbs={[{ label: "sign in" }]}>
				<div className="mx-auto max-w-sm pt-10">
					<LoginForm next={next} {...(error === undefined ? {} : { error })} sent={sent === "1"} />
				</div>
			</Shell>
		);
	}

	if (!authEnabled()) {
		return (
			<Shell crumbs={[{ label: "login" }]}>
				<h1 className="font-semibold text-2xl text-ink tracking-tight">No sign-in configured</h1>
				<p className="mt-3 text-ink-muted text-sm">
					This instance runs without accounts or an{" "}
					<code className="font-mono text-ink">HSP_TOKEN</code>, so there is nothing to sign in to.
				</p>
			</Shell>
		);
	}

	return (
		<Shell crumbs={[{ label: "login" }]}>
			<div className="mx-auto max-w-sm pt-10">
				<h1 className="font-semibold text-2xl text-ink tracking-tight">Owner sign in</h1>
				<p className="mt-2 text-ink-faint text-sm">Paste the owner token to browse every plan.</p>

				<form action="/api/session" method="post" className="mt-6 flex flex-col gap-3">
					<input type="hidden" name="next" value={next} />
					<input
						type="password"
						name="token"
						// biome-ignore lint/a11y/noAutofocus: the entire page is this one field
						autoFocus
						autoComplete="current-password"
						placeholder="hsp token"
						className="rounded-lg border border-line bg-surface-raised px-3 py-2.5 font-mono text-ink text-sm outline-none placeholder:text-ink-faint focus:border-accent"
					/>
					{error !== undefined && (
						<p className="text-red-400 text-xs">That token didn&rsquo;t match.</p>
					)}
					<button
						type="submit"
						className="rounded-lg bg-accent px-4 py-2.5 font-medium text-sm text-surface transition-opacity hover:opacity-90"
					>
						Sign in
					</button>
				</form>

				<p className="mt-6 text-ink-faint text-xs">
					Reading a single shared plan doesn&rsquo;t need this — use its link and 4-letter code.
				</p>
			</div>
		</Shell>
	);
}
