import { parseTasks, setTask, updatePlan } from "@hostplan/core";
import { die, note, printJson, style } from "../output";
import { resolveFilter, resolveRef, type ScopeOptions, syncPatch } from "./shared";

export interface TasksOptions extends ScopeOptions {
	json?: boolean;
}

export interface CheckOptions extends TasksOptions {
	/** Uncheck instead — for walking a mistake back. */
	undo?: boolean;
}

function progress(done: number, total: number): string {
	return `${done}/${total} done`;
}

/** The plan's checkboxes as durable, addressable state. */
export async function tasksCommand(ref: string, options: TasksOptions): Promise<void> {
	const plan = await resolveRef(ref, await resolveFilter(options));
	const tasks = parseTasks(plan.body);

	if (options.json === true) {
		printJson({ id: plan.meta.id, title: plan.meta.title, tasks });
		return;
	}
	if (tasks.length === 0) {
		note(style.dim(`${plan.meta.id} has no checkboxes — tasks come from \`- [ ]\` lines`));
		return;
	}
	const done = tasks.filter((task) => task.done).length;
	process.stdout.write(
		[
			`${style.bold(plan.meta.title)}  ${style.dim("·")}  ${style.cyan(plan.meta.id)}  ${style.dim("·")}  ${progress(done, tasks.length)}`,
			...tasks.map(
				(task) =>
					`  ${style.dim(String(task.index).padStart(2))} ${task.done ? style.green("[x]") : "[ ]"} ${task.done ? style.dim(task.text) : task.text}`,
			),
		].join("\n") + "\n",
	);
}

/** `hsp check <ref> 2 3` — tick steps off so the next session starts where this one stopped. */
export async function checkCommand(
	ref: string,
	numbers: string[],
	options: CheckOptions,
): Promise<void> {
	const plan = await resolveRef(ref, await resolveFilter(options));
	const indexes = numbers.map((value) => {
		const index = Number.parseInt(value, 10);
		if (Number.isNaN(index) || index < 1) die(`\`${value}\` is not a task number`);
		return index;
	});

	let body = plan.body;
	for (const index of indexes) {
		const next = setTask(body, index, options.undo !== true);
		if (next === undefined) {
			die(`no task ${index} — \`hsp tasks ${plan.meta.id}\` lists ${parseTasks(body).length}`);
		}
		body = next;
	}

	const updated = await updatePlan(plan.meta.id, { content: body });
	if (updated === undefined) die(`could not update \`${plan.meta.id}\``);
	await syncPatch(plan.meta.id, { content: body });

	const tasks = parseTasks(body);
	const done = tasks.filter((task) => task.done).length;
	if (options.json === true) {
		printJson({ id: plan.meta.id, tasks, done, total: tasks.length });
		return;
	}
	process.stdout.write(
		`${style.green("✓")} ${options.undo === true ? "unchecked" : "checked"} ${indexes.join(", ")}  ${style.dim("·")}  ${progress(done, tasks.length)}${done === tasks.length ? `  ${style.dim(`— all done; \`hsp status ${plan.meta.id} done\`?`)}` : ""}\n`,
	);
}
