import { after } from "next/server";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com").replace(
	/\/$/,
	"",
);

/**
 * Server-side conversion events contain coarse product state only. Callers must
 * never pass plan ids, titles, bodies, project names, branches, paths, or codes.
 */
export function captureServerEvent({
	event,
	distinctId,
	properties,
}: {
	event: string;
	distinctId: string;
	properties?: Record<string, string | boolean | number>;
}) {
	if (!key) return;
	after(async () => {
		try {
			await fetch(`${host}/capture/`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					api_key: key,
					event,
					properties: {
						distinct_id: distinctId,
						...properties,
					},
				}),
			});
		} catch {
			// Analytics is observational; it must never make plan creation fail.
		}
	});
}
