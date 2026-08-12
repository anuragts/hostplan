import type { ReactNode } from "react";

export const planDocumentId = (id: string) => `plan-document-${id}`;

export function PlanEnvironment({ id, children }: { id: string; children: ReactNode }) {
	return (
		<div id={planDocumentId(id)} className="plan-environment">
			{children}
		</div>
	);
}

export function PlanDocument({ children }: { children: ReactNode }) {
	return <section className="plan-document">{children}</section>;
}
