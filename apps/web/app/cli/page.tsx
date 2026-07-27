import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { currentViewer } from "@/lib/current-viewer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
	title: "Connect a terminal",
	robots: { index: false, follow: false },
};

/** Where `hsp login` sends a human to approve a terminal. */
export default async function CliApprovalPage({
	searchParams,
}: {
	searchParams: Promise<{ ok?: string; error?: string; code?: string }>;
}) {
	const { ok, error, code } = await searchParams;
	if ((await currentViewer()).kind !== "user") redirect("/login?next=%2Fcli");

	if (ok === "1") {
		return (
			<Shell crumbs={[{ label: "cli" }]}>
				<div className="mx-auto max-w-sm pt-10">
					<h1 className="font-semibold text-2xl text-ink tracking-tight">Terminal connected</h1>
					<p className="mt-3 text-ink-muted text-sm leading-relaxed">
						You can close this tab — the CLI has picked up its token.
					</p>
				</div>
			</Shell>
		);
	}

	return (
		<Shell crumbs={[{ label: "cli" }]}>
			<div className="mx-auto max-w-sm pt-10">
				<h1 className="font-semibold text-2xl text-ink tracking-tight">Connect a terminal</h1>
				<p className="mt-2 text-ink-muted text-sm">Enter the code `hsp login` printed.</p>

				<form action="/api/cli/approve" method="post" className="mt-6 flex flex-col gap-3">
					<input
						name="user_code"
						defaultValue={code ?? ""}
						required
						// biome-ignore lint/a11y/noAutofocus: the page is this one field
						autoFocus
						autoComplete="off"
						placeholder="XXXX-XXXX"
						className="rounded-lg border border-line bg-surface-raised px-3 py-2.5 text-center font-mono text-ink text-lg tracking-widest outline-none placeholder:text-ink-faint focus:border-brand"
					/>
					{error === "1" && (
						<p className="text-red-400 text-xs">That code is wrong, used, or expired.</p>
					)}
					<button
						type="submit"
						className="rounded-lg bg-brand px-4 py-2.5 font-medium text-sm text-surface transition-opacity hover:opacity-90"
					>
						Connect
					</button>
				</form>

				<p className="mt-6 text-ink-faint text-xs leading-relaxed">
					Only do this for a terminal you started yourself. Approving grants it full access to your
					plans until you revoke its token.
				</p>
			</div>
		</Shell>
	);
}
