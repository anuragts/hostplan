import { redirect } from "next/navigation";
import { RevealToken } from "@/components/reveal-token";
import { PageTitle, Shell } from "@/components/shell";
import { TokenList } from "@/components/token-list";
import { currentViewer } from "@/lib/current-viewer";

export const dynamic = "force-dynamic";

export default async function TokensPage({
	searchParams,
}: {
	searchParams: Promise<{ created?: string; error?: string }>;
}) {
	const { created, error } = await searchParams;
	const viewer = await currentViewer();
	if (viewer.kind !== "user") redirect("/login?next=%2Fsettings%2Ftokens");

	const { data } = await viewer.db
		.from("api_tokens")
		.select("id, name, created_at, last_used_at")
		.order("created_at", { ascending: false });

	return (
		<Shell crumbs={[{ label: "tokens" }]}>
			<PageTitle
				title="CLI tokens"
				subtitle="For agents and CI, which have no browser to approve a sign-in with."
			/>

			{created !== undefined && <RevealToken token={created} />}
			{error !== undefined && (
				<p className="mb-6 text-red-400 text-sm">Could not create that token.</p>
			)}

			<form action="/api/tokens" method="post" className="mb-10 flex flex-wrap gap-3">
				<input
					name="name"
					placeholder="what is it for?"
					className="min-w-0 flex-1 rounded-lg border border-line bg-surface-raised px-3 py-2 text-ink text-sm outline-none placeholder:text-ink-faint focus:border-ink-faint"
				/>
				<button
					type="submit"
					className="rounded-lg bg-accent px-4 py-2 font-medium text-sm text-surface transition-opacity hover:opacity-90"
				>
					Create token
				</button>
			</form>

			<TokenList
				tokens={
					(data ?? []) as Array<{
						id: string;
						name: string;
						created_at: string;
						last_used_at: string | null;
					}>
				}
			/>
		</Shell>
	);
}
