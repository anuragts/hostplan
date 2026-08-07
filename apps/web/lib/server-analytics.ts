import { randomUUID } from "node:crypto";
import { createServerAnalytics } from "@anuragdev/sea/server";
import { after } from "next/server";
import { SITE_URL } from "@/lib/site";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com").replace(
	/\/$/,
	"",
);
const seaProjectKey = process.env.NEXT_PUBLIC_SEA_PROJECT_KEY;
const sea = seaProjectKey
	? createServerAnalytics({
			projectKey: seaProjectKey,
			endpoint:
				process.env.NEXT_PUBLIC_SEA_COLLECTOR_URL ??
				"https://sea-worker.zshlabs.com/v1/collect",
		})
	: undefined;

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
	if (!key && !sea) return;
	after(async () => {
		const deliveries: Promise<unknown>[] = [];
		if (key) {
			deliveries.push(
				fetch(`${host}/capture/`, {
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
				}),
			);
		}
		if (sea && seaProjectKey) {
			deliveries.push(
				sea.send({
					schema_version: 1,
					event_id: `evt_${randomUUID()}`,
					timestamp: new Date().toISOString(),
					project_key: seaProjectKey,
					event_type: "event",
					source: "server",
					name: event,
					url: `${SITE_URL}/api/plans`,
					pathname: "/api/plans",
					...(properties === undefined ? {} : { properties }),
				}),
			);
		}

		try {
			await Promise.allSettled(deliveries);
		} catch {
			// Analytics is observational; it must never make plan creation fail.
		}
	});
}
