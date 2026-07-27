"use client";

import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as Provider } from "posthog-js/react";
import { type ReactNode, useEffect } from "react";
import { acquisitionSource, analyticsPath, sanitizedAnalyticsProperties } from "@/lib/acquisition";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

export function PostHogProvider({ children }: { children: ReactNode }) {
	const pathname = usePathname();

	useEffect(() => {
		// No key means a local `hsp serve` run — analytics stay off.
		if (!key) return;
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
	}, []);

	useEffect(() => {
		if (!key) return;
		const safePath = analyticsPath(pathname);
		const source = acquisitionSource(
			document.referrer,
			new URLSearchParams(window.location.search).get("utm_source") ?? undefined,
		);
		posthog.register_for_session({ acquisition_source: source });
		posthog.capture("$pageview", {
			$current_url: `${window.location.origin}${safePath}`,
			$pathname: safePath,
			acquisition_source: source,
		});
	}, [pathname]);

	if (!key) return children;
	return <Provider client={posthog}>{children}</Provider>;
}
