"use client";

import { useEffect, useRef, useState } from "react";
import { ProviderIcon } from "@/components/provider-icon";
import { captureAnalyticsEvent } from "@/lib/client-analytics";
import type { OpenTarget, ProviderId } from "@/lib/providers";

const STORAGE_KEY = "hostplan:open-in";

/** Points down while closed, and flips up to mirror the menu once it's open. */
function Chevron({ pointUp }: { pointUp: boolean }) {
	return (
		<svg
			viewBox="0 0 16 16"
			aria-hidden="true"
			className={`h-3.5 w-3.5 transition-transform duration-150 ${pointUp ? "" : "rotate-180"}`}
		>
			<path
				d="M4 10l4-4 4 4"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function Check() {
	return (
		<svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-teal-600">
			<path
				d="M3.5 8.5l3 3 6-7"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.75"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

/**
 * Split button: the wide half launches the selected app, the caret picks a
 * different one. Choosing from the menu launches immediately and is remembered,
 * so the common path stays a single click.
 */
export function OpenIn({ targets }: { targets: OpenTarget[] }) {
	const fallback = targets[0];
	const [selectedId, setSelectedId] = useState<ProviderId | undefined>(fallback?.id);
	const [menuOpen, setMenuOpen] = useState(false);
	const root = useRef<HTMLDivElement>(null);

	// Read the remembered choice only after mount, so the server and the first
	// client render agree on what to show.
	useEffect(() => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved !== null && targets.some((target) => target.id === saved)) {
			setSelectedId(saved as ProviderId);
		}
	}, [targets]);

	useEffect(() => {
		if (!menuOpen) return;
		const onPointerDown = (event: MouseEvent) => {
			if (!root.current?.contains(event.target as Node)) setMenuOpen(false);
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setMenuOpen(false);
		};
		document.addEventListener("mousedown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("mousedown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [menuOpen]);

	const selected = targets.find((target) => target.id === selectedId) ?? fallback;
	if (selected === undefined) return null;

	function launch(target: OpenTarget) {
		setSelectedId(target.id);
		localStorage.setItem(STORAGE_KEY, target.id);
		setMenuOpen(false);
		captureAnalyticsEvent("plan_opened_in_agent", { provider: target.id });
		window.location.href = target.url;
	}

	return (
		<div ref={root} className="hostplan-open-in fixed right-6 bottom-6 z-50">
			{menuOpen && (
				<div
					role="menu"
					aria-label="Open this plan in"
					className="plan-open-in-menu absolute right-0 bottom-full mb-2 w-64 overflow-hidden rounded-xl bg-surface-raised p-1.5 text-ink shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_16px_48px_-20px_rgba(0,0,0,0.8)]"
				>
					{targets.map((target) => (
						<button
							key={target.id}
							type="button"
							role="menuitem"
							onClick={() => launch(target)}
							className="plan-open-in-item flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left outline-none transition-[background-color,color] duration-150 ease-out hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-brand/40"
						>
							<ProviderIcon id={target.id} />
							<span className="min-w-0 flex-1">
								<span className="plan-open-in-label block truncate text-ink text-sm">
									{target.label}
								</span>
								<span className="plan-open-in-hint block truncate text-ink-faint text-xs">
									{target.hint}
								</span>
							</span>
							{target.id === selected.id && <Check />}
						</button>
					))}
				</div>
			)}

			<div className="plan-open-in-control flex items-stretch overflow-hidden rounded-xl bg-surface-raised shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_12px_36px_-18px_rgba(0,0,0,0.8)] transition-[box-shadow] duration-150 ease-out hover:shadow-[0_0_0_1px_rgba(255,255,255,0.16),0_16px_40px_-18px_rgba(0,0,0,0.85)]">
				<button
					type="button"
					onClick={() => launch(selected)}
					className="plan-open-in-main flex min-h-11 items-center gap-2 pl-4 pr-3.5 font-medium text-ink text-sm outline-none transition-[background-color,color,scale] duration-150 ease-out hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 active:scale-[0.96]"
				>
					<ProviderIcon id={selected.id} />
					Open in {selected.label}
				</button>
				<button
					type="button"
					onClick={() => setMenuOpen((open) => !open)}
					aria-haspopup="menu"
					aria-expanded={menuOpen}
					aria-label="Choose a different app"
					className="plan-open-in-caret flex min-h-11 items-center border-white/10 border-l px-2.5 text-ink-faint outline-none transition-[background-color,color,scale] duration-150 ease-out hover:bg-white/[0.06] hover:text-ink focus-visible:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 active:scale-[0.96]"
				>
					<Chevron pointUp={menuOpen} />
				</button>
			</div>
		</div>
	);
}
