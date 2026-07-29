"use client";

import { PLAN_THEMES, type PlanThemeId, planTheme as themeById } from "@hostplan/core/theme";
import { Palette } from "lucide-react";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";
import { planDocumentId } from "@/components/plan-document";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	clearStoredPlanTheme,
	readStoredPlanTheme,
	writeStoredPlanTheme,
} from "@/lib/plan-theme-storage";
import { cn } from "@/lib/utils";

function applyTheme(id: string, theme: PlanThemeId): void {
	const document = window.document.getElementById(planDocumentId(id));
	if (document !== null) document.dataset.planTheme = theme;
}

export function PlanThemeControl({
	id,
	authorTheme,
	isOwner,
}: {
	id: string;
	authorTheme: PlanThemeId;
	isOwner: boolean;
}) {
	const confirmedTheme = useRef(authorTheme);
	const [shown, setShown] = useState(authorTheme);
	const [saving, setSaving] = useState(false);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		if (isOwner) {
			confirmedTheme.current = authorTheme;
			clearStoredPlanTheme(id);
			applyTheme(id, authorTheme);
			setShown(authorTheme);
			return;
		}
		const stored = readStoredPlanTheme(id);
		if (stored !== undefined) {
			applyTheme(id, stored.theme);
			setShown(stored.theme);
		}
	}, [authorTheme, id, isOwner]);

	function choose(next: PlanThemeId) {
		if (next === shown) return;
		setShown(next);
		setFailed(false);
		applyTheme(id, next);

		if (!isOwner) {
			writeStoredPlanTheme(id, next);
			posthog.capture("plan_theme_personalized", { theme: next });
			return;
		}

		setSaving(true);
		void fetch(`/api/plans/${id}`, {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ theme: next }),
		})
			.then((response) => {
				if (!response.ok) throw new Error(String(response.status));
				confirmedTheme.current = next;
				posthog.capture("plan_theme_changed", { theme: next });
			})
			.catch(() => {
				applyTheme(id, confirmedTheme.current);
				setShown(confirmedTheme.current);
				setFailed(true);
				posthog.capture("plan_theme_save_failed");
			})
			.finally(() => setSaving(false));
	}

	function reset() {
		clearStoredPlanTheme(id);
		applyTheme(id, authorTheme);
		setShown(authorTheme);
		posthog.capture("plan_theme_personalization_reset");
	}

	const current = themeById(shown);
	const busy = saving;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label={`${isOwner ? "Shared theme" : "Appearance"}: ${current.label}`}
				disabled={busy}
				className={cn(
					"plan-theme-trigger inline-flex min-h-10 items-center gap-2 rounded-lg bg-surface-raised px-3 font-mono text-ink-muted text-xs shadow-[0_0_0_1px_rgba(255,255,255,0.08)] outline-none transition-[box-shadow,color,scale,opacity] duration-150 ease-out hover:text-ink hover:shadow-[0_0_0_1px_rgba(255,255,255,0.13)] focus-visible:ring-2 focus-visible:ring-brand/40 active:scale-[0.96]",
					busy && "opacity-60",
					failed &&
						"text-destructive shadow-[0_0_0_1px_color-mix(in_oklab,var(--destructive)_60%,transparent)]",
				)}
			>
				<Palette aria-hidden className="size-3.5" />
				<span>{failed ? "not saved" : current.label}</span>
				<span aria-hidden className="text-[0.6rem] opacity-60">
					▾
				</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				data-plan-theme={shown}
				className="plan-theme-menu w-80 p-1.5"
			>
				<DropdownMenuLabel className="px-2 py-1.5">
					<span className="plan-theme-menu-title block text-ink text-xs">
						{isOwner ? "Shared theme" : "Appearance"}
					</span>
					<span className="plan-theme-menu-copy mt-0.5 block text-pretty font-normal text-[0.7rem] text-ink-faint leading-relaxed">
						{isOwner
							? "Everyone opening this plan sees it."
							: "Changes only this plan in this browser."}
					</span>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuRadioGroup
					value={shown}
					onValueChange={(value) => choose(value as PlanThemeId)}
				>
					{PLAN_THEMES.map((theme) => (
						<DropdownMenuRadioItem
							key={theme.id}
							value={theme.id}
							className="min-h-12 gap-2.5 rounded-md px-2 py-2 pr-8"
						>
							<span
								aria-hidden
								data-theme-swatch={theme.id}
								className="theme-swatch size-6 shrink-0 rounded-sm"
							/>
							<span className="min-w-0">
								<span className="plan-theme-menu-title block font-medium text-xs">
									{theme.label}
								</span>
								<span className="plan-theme-menu-copy mt-0.5 block text-pretty text-[0.68rem] text-ink-faint leading-snug">
									{theme.description}
								</span>
							</span>
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
				{!isOwner && shown !== authorTheme && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onSelect={reset}
							className="plan-theme-menu-reset min-h-10 px-2 text-ink-muted text-xs"
						>
							Reset to author theme
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
