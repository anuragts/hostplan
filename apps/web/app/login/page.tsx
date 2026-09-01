import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { Shell } from "@/components/shell";
import { authEnabled } from "@/lib/auth";
import { currentViewer } from "@/lib/current-viewer";
import { accountsEnabled } from "@/lib/supabase-clients";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
	title: "Sign in",
	robots: { index: false, follow: false },
};

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ next?: string; error?: string; sent?: string }>;
}) {
	const { next = "/", error, sent } = await searchParams;

	const accounts = accountsEnabled();
	const viewer = await currentViewer();

	if (accounts && viewer.kind === "user") redirect(next);
	if (!accounts && authEnabled() && viewer.kind === "local") redirect(next);

	if (accounts) {
		return (
			<Shell crumbs={[{ label: "sign in" }]}>
				<div className="mx-auto max-w-sm pt-10">
					<LoginForm next={next} {...(error === undefined ? {} : { error })} sent={sent === "1"} />
				</div>
			</Shell>
		);
	}

	if (!authEnabled()) {
		const remoteStore = process.env.SUPABASE_URL !== undefined;
		return (
			<Shell crumbs={[{ label: "sign in" }]}>
				<h1 className="font-semibold text-2xl text-ink tracking-tight">
					{remoteStore ? "Sign-in not configured" : "No sign-in needed"}
				</h1>
				<p className="mt-3 text-ink-muted text-sm">
					{remoteStore ? (
						<>
							This remote instance is locked. Configure an{" "}
							<code className="font-mono text-ink">HSP_TOKEN</code> or enable accounts.
						</>
					) : (
						"This local instance runs without accounts, so every page is already open."
					)}
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
			</div>
		</Shell>
	);
}
