"use client";

import posthog from "posthog-js";
import { PostHogProvider as Provider } from "posthog-js/react";
import { type ReactNode, useEffect } from "react";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

export function PostHogProvider({ children }: { children: ReactNode }) {
	useEffect(() => {
		// No key means a local `hsp serve` run — analytics stay off.
		if (!key) return;
		posthog.init(key, {
			api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
			defaults: "2025-05-24",
		});
	}, []);

	if (!key) return children;
	return <Provider client={posthog}>{children}</Provider>;
}
