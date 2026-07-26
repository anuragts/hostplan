import {
	getPlan,
	isStatus,
	listPlans,
	nextActionable,
	PLAN_STATUSES,
	updatePlan,
} from "@hostplan/core";
import { die, printJson, style } from "../output";
import { resolveFilter, resolveRef, type ScopeOptions, statusLabel, syncPatch } from "./shared";

export interface StatusOptions extends ScopeOptions {
	json?: boolean;
}

export async function statusCommand(
	ref: string,
	next: string | undefined,
	options: StatusOptions,
): Promise<void> {
	const plan = await resolveRef(ref, await resolveFilter(options));

	if (next === undefined) {
		const dependency =
			plan.meta.dependsOn === undefined ? undefined : await getPlan(plan.meta.dependsOn);
		const blocked = dependency !== undefined && dependency.meta.status !== "done";

		if (options.json === true) {
			printJson({
				id: plan.meta.id,
				title: plan.meta.title,
				status: plan.meta.status,
				blocked,
				...(plan.meta.dependsOn === undefined ? {} : { dependsOn: plan.meta.dependsOn }),
			});
			return;
		}
		const lines = [
			`${style.bold(plan.meta.title)}  ${style.dim("·")}  ${style.cyan(plan.meta.id)}  ${style.dim("·")}  ${statusLabel(plan.meta.status)}`,
			...(dependency === undefined
				? []
				: [
						blocked
							? `${style.red("⛔")} blocked by ${style.cyan(dependency.meta.id)}  ${dependency.meta.title}  ${style.dim("·")}  ${statusLabel(dependency.meta.status)}`
							: `${style.dim(`follows ${dependency.meta.id}  ${dependency.meta.title} · done`)}`,
					]),
		];
		process.stdout.write(`${lines.join("\n")}\n`);
		return;
	}

	if (!isStatus(next)) {
		die(`\`${next}\` is not a status — use one of ${PLAN_STATUSES.join(", ")}`);
	}

	const updated = await updatePlan(plan.meta.id, { status: next });
	if (updated === undefined) die(`could not update \`${plan.meta.id}\``);
	await syncPatch(plan.meta.id, { status: next });

	// Finishing a step is what unblocks the next one — say so, so the human (or
	// agent) reading the output knows what just became actionable.
	const unblocked =
		next === "done"
			? (await listPlans()).filter((candidate) => candidate.meta.dependsOn === plan.meta.id)
			: [];

	if (options.json === true) {
		printJson({
			id: updated.meta.id,
			title: updated.meta.title,
			status: updated.meta.status,
			unblocks: unblocked.map((p) => p.meta.id),
		});
		return;
	}

	process.stdout.write(
		[
			`${style.green("✓")} ${statusLabel(next)}  ${style.bold(updated.meta.title)}  ${style.dim("·")}  ${style.cyan(updated.meta.id)}`,
			...unblocked.map(
				(p) =>
					`${style.dim("→")} unblocks ${style.cyan(p.meta.id)}  ${p.meta.title}  ${style.dim("·")}  ${statusLabel(p.meta.status)}`,
			),
		].join("\n") + "\n",
	);
}

/** `hsp next` — the plan an agent should pick up in this scope. */
export async function nextCommand(options: StatusOptions): Promise<void> {
	const filter = await resolveFilter(options);
	const plans = await listPlans(filter);
	const next = nextActionable(plans);

	if (next === undefined) {
		if (options.json === true) printJson({ next: null });
		else
			process.stdout.write(`${style.dim("nothing actionable — everything is done or blocked")}\n`);
		return;
	}

	if (options.json === true) {
		printJson({ next: { ...next.meta, path: next.path } });
		return;
	}
	process.stdout.write(
		[
			`${style.bold(next.meta.title)}  ${style.dim("·")}  ${style.cyan(next.meta.id)}  ${style.dim("·")}  ${statusLabel(next.meta.status)}`,
			style.dim(
				`read it with \`hsp get ${next.meta.id}\`, mark it \`hsp status ${next.meta.id} done\` when finished`,
			),
		].join("\n") + "\n",
	);
}
