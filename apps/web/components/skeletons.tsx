import { Shell } from "@/components/shell";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading states mirror the shape of what they're waiting for, so nothing
 * jumps when the data lands. Widths are fixed rather than random: a skeleton
 * that reshuffles on every navigation draws attention to itself.
 */

export function SkeletonRow({ stagger = 0 }: { stagger?: number }) {
	return (
		<div
			className="animate-fade-up flex items-center gap-4 rounded-lg border border-line bg-surface-raised/40 px-4 py-3"
			style={{ "--stagger": `${stagger}ms` } as React.CSSProperties}
		>
			<div className="min-w-0 flex-1 space-y-2">
				<Skeleton className="h-4 w-2/5" />
				<Skeleton className="h-3 w-1/4" />
			</div>
			<Skeleton className="h-3 w-10" />
		</div>
	);
}

export function SkeletonTitle() {
	return (
		<div className="mb-8 space-y-3">
			<Skeleton className="h-7 w-48" />
			<Skeleton className="h-4 w-72" />
		</div>
	);
}

/** Shared by the dashboard and the index pages — a title and a column of rows. */
export function ListPageSkeleton({
	rows = 4,
	search = false,
}: {
	rows?: number;
	search?: boolean;
}) {
	return (
		<Shell crumbs={[]}>
			<SkeletonTitle />
			{search && <Skeleton className="mb-8 h-10 w-full" />}
			<div className="flex flex-col gap-2">
				{Array.from({ length: rows }, (_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: placeholder rows never reorder
					<SkeletonRow key={i} stagger={i * 40} />
				))}
			</div>
		</Shell>
	);
}

/** The plan page: header block, then prose lines that thin out. */
export function PlanPageSkeleton() {
	const widths = ["w-full", "w-11/12", "w-4/5", "w-full", "w-3/5", "w-5/6", "w-2/3"];
	return (
		<Shell crumbs={[]}>
			<div className="mb-8 border-b border-line pb-6">
				<Skeleton className="h-8 w-3/5" />
				<div className="mt-4 flex gap-3">
					<Skeleton className="h-5 w-16" />
					<Skeleton className="h-5 w-20" />
					<Skeleton className="h-5 w-24" />
				</div>
			</div>
			<div className="space-y-3">
				{widths.map((width, i) => (
					<Skeleton
						// biome-ignore lint/suspicious/noArrayIndexKey: placeholder lines never reorder
						key={i}
						className={`h-4 ${width}`}
						style={{ animationDelay: `${i * 60}ms` }}
					/>
				))}
			</div>
		</Shell>
	);
}
