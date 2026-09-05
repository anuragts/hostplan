"use client";

import { useEffect, useState } from "react";
import type { PlanOutlineItem } from "./types";

export function PlanOutline({
	items,
	hiddenItems,
	planId,
}: {
	items: PlanOutlineItem[];
	hiddenItems: number;
	planId: string;
}) {
	const [activeId, setActiveId] = useState(items[0]?.id);

	useEffect(() => {
		let headingObserver: IntersectionObserver | undefined;
		let bodyObserver: MutationObserver | undefined;

		const startObservingHeadings = (): boolean => {
			if (headingObserver !== undefined) return true;
			const headings = items.flatMap((item) => {
				const heading = document.getElementById(item.id);
				return heading === null ? [] : [heading];
			});
			if (headings.length === 0) return false;

			const updateActiveHeading = () => {
				const threshold = window.innerHeight * 0.28;
				let current = headings[0];
				for (const heading of headings) {
					if (heading.getBoundingClientRect().top > threshold) break;
					current = heading;
				}
				setActiveId(current?.id);
			};

			headingObserver = new IntersectionObserver(updateActiveHeading, {
				rootMargin: "-20% 0px -65% 0px",
			});
			for (const heading of headings) headingObserver.observe(heading);
			updateActiveHeading();
			return true;
		};

		if (!startObservingHeadings()) {
			const plan = document.getElementById(`plan-document-${planId}`);
			if (plan !== null) {
				bodyObserver = new MutationObserver(() => {
					if (startObservingHeadings()) bodyObserver?.disconnect();
				});
				bodyObserver.observe(plan, { childList: true, subtree: true });
			}
		}

		return () => {
			headingObserver?.disconnect();
			bodyObserver?.disconnect();
		};
	}, [items, planId]);

	return (
		<nav className="plan-outline" aria-label="On this page">
			<p className="plan-outline-label">On this page</p>
			<ol className="plan-outline-list">
				{items.map((item) => (
					<li key={item.id}>
						<a
							href={`#${item.id}`}
							aria-current={activeId === item.id ? "location" : undefined}
							data-severity={item.severity}
							onClick={() => setActiveId(item.id)}
						>
							{item.text}
						</a>
					</li>
				))}
			</ol>
			{hiddenItems > 0 && <p className="plan-outline-more">+{hiddenItems} more sections</p>}
		</nav>
	);
}
