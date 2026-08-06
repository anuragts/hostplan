import { FileCode2 } from "lucide-react";

export function CustomHtmlBadge() {
	return (
		<span className="plan-custom-html-badge inline-flex min-h-10 items-center gap-2 rounded-lg bg-surface-raised px-3 font-mono text-ink-muted text-xs shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
			<FileCode2 aria-hidden className="size-3.5" />
			Custom HTML · v1
		</span>
	);
}
