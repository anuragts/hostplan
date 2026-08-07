"use client";

import { type Analytics, createAnalytics, type EventProperties } from "@anuragdev/sea/analytics";
import posthog from "posthog-js";
import { type AcquisitionSource, analyticsPath } from "@/lib/acquisition";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const seaProjectKey = process.env.NEXT_PUBLIC_SEA_PROJECT_KEY;
const seaEndpoint =
	process.env.NEXT_PUBLIC_SEA_COLLECTOR_URL ??
	"https://sea-worker.zshlabs.com/v1/collect";

let sea: Analytics | undefined;

function seaClient(): Analytics | undefined {
	if (!seaProjectKey) return undefined;
	sea ??= createAnalytics({
		projectKey: seaProjectKey,
		endpoint: seaEndpoint,
		autoTrack: false,
		getPageContext: () => {
			const pathname = analyticsPath(window.location.pathname);
			return {
				url: `${window.location.origin}${pathname}`,
				pathname,
				referrer: "",
			};
		},
	});
	return sea;
}

export function startSeaAnalytics(): () => void {
	const client = seaClient();
	client?.start();
	return () => client?.destroy();
}

export function captureAnalyticsPageView(pathname: string, source: AcquisitionSource): void {
	const safePath = analyticsPath(pathname);
	if (posthogKey) {
		posthog.register_for_session({ acquisition_source: source });
		posthog.capture("$pageview", {
			$current_url: `${window.location.origin}${safePath}`,
			$pathname: safePath,
			acquisition_source: source,
		});
	}

	const client = seaClient();
	client?.start();
	client?.page(
		{ acquisition_source: source },
		{
			url: `${window.location.origin}${safePath}`,
			pathname: safePath,
			referrer: "",
		},
	);
}

export function captureAnalyticsEvent(event: string, properties: EventProperties = {}): void {
	if (posthogKey) posthog.capture(event, properties);

	const client = seaClient();
	client?.start();
	client?.track(event, properties);
}
