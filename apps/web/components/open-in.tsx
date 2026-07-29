"use client";

import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";
import { ProviderIcon } from "@/components/provider-icon";
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
		posthog.capture("plan_opened_in_agent", { provider: target.id });
		window.location.href = target.url;
	}

	return (
		<div ref={root} className="hostplan-open-in fixed right-6 bottom-6 z-50">
			{menuOpen && (
				<div
					role="menu"
					aria-label="Open this plan in"
					className="absolute right-0 bottom-full mb-2 w-64 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-black/50 shadow-xl"
				>
					{targets.map((target) => (
						<button
							key={target.id}
							type="button"
							role="menuitem"
							onClick={() => launch(target)}
							className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-neutral-100"
						>
							<ProviderIcon id={target.id} />
							<span className="min-w-0 flex-1">
								<span className="block truncate text-neutral-900 text-sm">{target.label}</span>
								<span className="block truncate text-neutral-500 text-xs">{target.hint}</span>
							</span>
							{target.id === selected.id && <Check />}
						</button>
					))}
				</div>
			)}

			<div className="flex items-stretch overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-black/40 shadow-lg">
				<button
					type="button"
					onClick={() => launch(selected)}
					className="flex items-center gap-2 px-4 py-2.5 font-medium text-neutral-900 text-sm transition-colors hover:bg-neutral-100"
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
					className="flex items-center border-neutral-200 border-l px-2.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
				>
					<Chevron pointUp={menuOpen} />
				</button>
			</div>
		</div>
	);
}
