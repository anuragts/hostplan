const UNITS: Array<[limit: number, seconds: number, label: string]> = [
	[60, 1, "s ago"],
	[3600, 60, "m ago"],
	[86400, 3600, "h ago"],
	[2592000, 86400, "d ago"],
];

export function relativeTime(iso: string): string {
	const then = Date.parse(iso);
	if (Number.isNaN(then)) return "unknown";
	const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
	if (seconds < 5) return "just now";
	for (const [limit, divisor, label] of UNITS) {
		if (seconds < limit) return `${Math.floor(seconds / divisor)}${label}`;
	}
	return `${Math.floor(seconds / 2592000)}mo ago`;
}

export function absoluteTime(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return date.toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
	return `${count} ${count === 1 ? singular : pluralForm}`;
}
