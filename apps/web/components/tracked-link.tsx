"use client";

import Link from "next/link";
import posthog from "posthog-js";
import type { ComponentProps } from "react";

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
				posthog.capture(event, { destination: String(props.href).split("?")[0] });
				props.onClick?.(click);
			}}
		/>
	);
}
