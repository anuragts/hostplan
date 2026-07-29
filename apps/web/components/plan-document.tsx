import { PLAN_THEME_IDS, type PlanThemeId } from "@hostplan/core/theme";
import type { ReactNode } from "react";
import { planThemeStorageKey } from "@/lib/plan-theme-storage";

export const planDocumentId = (id: string) => `plan-document-${id}`;

export function PlanDocument({
	id,
	theme,
	children,
}: {
	id: string;
	theme: PlanThemeId;
	children: ReactNode;
}) {
	return (
		<section
			id={planDocumentId(id)}
			data-plan-theme={theme}
			className="plan-document"
			suppressHydrationWarning
		>
			{children}
		</section>
	);
}

/**
 * The themed element is already parsed when this inline script runs, so a
 * personal reader override lands before first paint rather than flashing from
 * the author theme after hydration.
 */
export function PlanThemeBootstrap({ id }: { id: string }) {
	const script = `try{const raw=localStorage.getItem(${JSON.stringify(planThemeStorageKey(id))});if(raw){const value=JSON.parse(raw);if(value&&value.mode==="personal"&&${JSON.stringify(PLAN_THEME_IDS)}.includes(value.theme)){const node=document.getElementById(${JSON.stringify(planDocumentId(id))});if(node)node.dataset.planTheme=value.theme}}}catch{}`;
	return (
		<script
			// Static ids and a closed theme registry are the only values embedded.
			// biome-ignore lint/security/noDangerouslySetInnerHtml: pre-paint local preference bootstrap
			dangerouslySetInnerHTML={{ __html: script }}
		/>
	);
}
