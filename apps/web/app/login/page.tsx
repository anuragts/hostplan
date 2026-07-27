import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { Shell } from "@/components/shell";
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

	// Without accounts there is nothing to sign in to: running locally, every
	// page is already open.
	if (!accountsEnabled()) {
		return (
			<Shell crumbs={[{ label: "sign in" }]}>
				<h1 className="font-semibold text-2xl text-ink tracking-tight">No sign-in needed</h1>
				<p className="mt-3 text-ink-muted text-sm">
					This instance runs without accounts, so every page is already open.
				</p>
			</Shell>
		);
	}

	if ((await currentViewer()).kind === "user") redirect(next);

	return (
		<Shell crumbs={[{ label: "sign in" }]}>
			<div className="mx-auto max-w-sm pt-10">
				<LoginForm next={next} {...(error === undefined ? {} : { error })} sent={sent === "1"} />
			</div>
		</Shell>
	);
}
