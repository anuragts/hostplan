"use client";

import { PlanEnvironment } from "@/components/plan-document";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";

export default function PlanError({ reset }: { error: Error; reset: () => void }) {
	return (
		<PlanEnvironment id="plan-error">
			<Shell crumbs={[{ label: "could not load plan" }]}>
				<div className="mx-auto max-w-[76ch] py-16 text-center">
					<h1 className="text-balance font-semibold text-2xl text-ink tracking-tight">
						This plan did not load
					</h1>
					<p className="mx-auto mt-3 max-w-md text-pretty text-ink-muted text-sm leading-6">
						The plan may be temporarily unavailable. Try the request again.
					</p>
					<Button
						type="button"
						onClick={reset}
						className="mt-6 h-10 px-4 transition-[background-color,transform] active:scale-[0.96]"
					>
						Try again
					</Button>
				</div>
			</Shell>
		</PlanEnvironment>
	);
}
