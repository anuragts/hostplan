/**
 * A plan's checklist is its markdown checkboxes. The body stays the source of
 * truth: reading tasks parses it, checking one rewrites the matching line, so
 * the rendered plan and the task state can never disagree.
 */

export interface PlanTask {
	/** 1-based position among the checkboxes — what `hsp check <ref> <n>` takes. */
	index: number;
	text: string;
	done: boolean;
	/** 0-based line number in the body, for rewriting. */
	line: number;
}

const CHECKBOX = /^(\s*(?:[-*+]|\d+[.)])\s+)\[( |x|X)\]\s+(.*)$/;

export function parseTasks(body: string): PlanTask[] {
	const tasks: PlanTask[] = [];
	body.split("\n").forEach((line, lineNumber) => {
		const match = line.match(CHECKBOX);
		if (match === null) return;
		tasks.push({
			index: tasks.length + 1,
			text: (match[3] ?? "").trim(),
			done: match[2] !== " ",
			line: lineNumber,
		});
	});
	return tasks;
}

/** Returns the body with task `index` set to `done`, or undefined if there is no such task. */
export function setTask(body: string, index: number, done: boolean): string | undefined {
	const task = parseTasks(body).find((candidate) => candidate.index === index);
	if (task === undefined) return undefined;
	const lines = body.split("\n");
	const line = lines[task.line];
	if (line === undefined) return undefined;
	lines[task.line] = line.replace(/\[( |x|X)\]/, done ? "[x]" : "[ ]");
	return lines.join("\n");
}
