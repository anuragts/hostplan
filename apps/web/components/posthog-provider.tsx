"use client";

import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as Provider } from "posthog-js/react";
import { type ReactNode, useEffect } from "react";
import { acquisitionSource, sanitizedAnalyticsProperties } from "@/lib/acquisition";
import { captureAnalyticsPageView, startSeaAnalytics } from "@/lib/client-analytics";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

export function PostHogProvider({ children }: { children: ReactNode }) {
	const pathname = usePathname();

	useEffect(() => {
		// No keys means a local `hsp serve` run — analytics stay off.
		if (key) {
			posthog.init(key, {
				api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
				defaults: "2025-05-24",
				autocapture: false,
				capture_pageview: false,
				capture_pageleave: false,
				disable_session_recording: true,
				before_send: (event) => {
					if (event === null) return null;
					const sanitize = (properties: Record<string, unknown>) =>
						sanitizedAnalyticsProperties(
							properties,
							window.location.origin,
							window.location.pathname,
						);
					return {
						...event,
						properties: sanitize(event.properties),
						...(event.$set === undefined ? {} : { $set: sanitize(event.$set) }),
						...(event.$set_once === undefined ? {} : { $set_once: sanitize(event.$set_once) }),
					};
				},
			});
		}
		return startSeaAnalytics();
	}, []);

	useEffect(() => {
		const source = acquisitionSource(
			document.referrer,
			new URLSearchParams(window.location.search).get("utm_source") ?? undefined,
		);
		captureAnalyticsPageView(pathname, source);
	}, [pathname]);

	if (!key) return children;
	return <Provider client={posthog}>{children}</Provider>;
}
