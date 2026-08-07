"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { captureAnalyticsEvent } from "@/lib/client-analytics";

export function TrackedLink({
	event,
	...props
}: ComponentProps<typeof Link> & {
	event: string;
}) {
	return (
		<Link
			{...props}
			onClick={(click) => {
				captureAnalyticsEvent(event, {
					destination: String(props.href).split("?")[0] ?? "",
				});
				props.onClick?.(click);
			}}
		/>
	);
}
