const COLOR = process.stdout.isTTY === true && process.env.NO_COLOR === undefined;

function paint(code: string): (text: string) => string {
	return (text) => (COLOR ? `[${code}m${text}[0m` : text);
}

export const style = {
	bold: paint("1"),
	dim: paint("2"),
	red: paint("31"),
	green: paint("32"),
	yellow: paint("33"),
	blue: paint("34"),
	cyan: paint("36"),
};

/** Human-facing chatter goes to stderr so `hsp get` can be piped safely. */
export function note(message: string): void {
	process.stderr.write(`${message}\n`);
}

export function warn(message: string): void {
	note(`${style.yellow("!")} ${message}`);
}

export function printJson(value: unknown): void {
	process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export class CliError extends Error {}

export function die(message: string): never {
	throw new CliError(message);
}

const UNITS: Array<[limit: number, seconds: number, label: string]> = [
	[60, 1, "s"],
	[3600, 60, "m"],
	[86400, 3600, "h"],
	[2592000, 86400, "d"],
];

export function relativeTime(iso: string): string {
	const then = Date.parse(iso);
	if (Number.isNaN(then)) return "unknown";
	const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
	for (const [limit, divisor, label] of UNITS) {
		if (seconds < limit) return `${Math.floor(seconds / divisor)}${label}`;
	}
	return `${Math.floor(seconds / 2592000)}mo`;
}

/** Left-aligned columns, sized to content. */
export function table(rows: string[][]): string {
	const widths: number[] = [];
	for (const row of rows) {
		row.forEach((cell, i) => {
			widths[i] = Math.max(widths[i] ?? 0, visibleLength(cell));
		});
	}
	return rows
		.map((row) =>
			row
				.map((cell, i) =>
					i === row.length - 1 ? cell : cell + " ".repeat((widths[i] ?? 0) - visibleLength(cell)),
				)
				.join("  ")
				.trimEnd(),
		)
		.join("\n");
}

// biome-ignore lint/suspicious/noControlCharactersInRegex: measuring around ANSI codes is the point
const ANSI = /\[[0-9;]*m/g;

function visibleLength(text: string): number {
	return text.replace(ANSI, "").length;
}
