import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import {
	type AddPlanInput,
	addPlan,
	deslugify,
	detectScope,
	displayPath,
	formatFromPath,
	isPlanTheme,
	isStatus,
	PLAN_STATUSES,
	PLAN_THEME_IDS,
	type PlanFormat,
	type PlanMeta,
	type PlanStatus,
	projectDirName,
	readSourceFrontmatter,
	resolvePort,
	type Scope,
	type StoredPlan,
	shareUrls,
	slugify,
	titleFromHtml,
	titleFromMarkdown,
} from "@hostplan/core";
import { ensureServer } from "../daemon";
import { die, printJson, style, warn } from "../output";
import { currentRemote, push, type RemotePlan } from "../remote";
import { assertValidCustomHtml } from "./custom-html";
import { openInBrowser, resolveRef } from "./shared";

export interface AddOptions {
	content?: string;
	title?: string;
	project?: string;
	branch?: string;
	format?: string;
	open?: boolean;
	quiet?: boolean;
	json?: boolean;
	serve: boolean;
	local?: boolean;
	/** commander sets this false for --private, true for --public */
	public?: boolean;
	private?: boolean;
	/** Plan id this one waits on — chains it into a stack. */
	after?: string;
	status?: string;
	theme?: string;
}

function parseFormat(value: string | undefined, fallback: PlanFormat): PlanFormat {
	if (value === undefined) return fallback;
	if (value === "md" || value === "html") return value;
	return die(`--format must be \`md\` or \`html\`, got \`${value}\``);
}

export function parseStatus(value: string | undefined): PlanStatus | undefined {
	if (value === undefined) return undefined;
	if (isStatus(value)) return value;
	return die(`--status must be one of ${PLAN_STATUSES.join(", ")}, got \`${value}\``);
}

interface Source {
	raw: string;
	format: PlanFormat;
	path?: string;
}

async function readSource(file: string | undefined, options: AddOptions): Promise<Source> {
	if (file !== undefined && options.content !== undefined) {
		die("pass either a file or --content, not both");
	}

	if (file !== undefined) {
		const path = resolve(file);
		const raw = await readFile(path, "utf8").catch(() => die(`cannot read \`${file}\``));
		return { raw, format: parseFormat(options.format, formatFromPath(path)), path };
	}

	if (options.content !== undefined) {
		return { raw: options.content, format: parseFormat(options.format, "md") };
	}

	return die("nothing to store — pass a plan file or --content");
}

export interface StoredResult {
	plan: StoredPlan;
	meta: PlanMeta | RemotePlan;
	links: { url: string; codedUrl?: string };
	remoteUrl?: string;
}

/**
 * The whole add pipeline for one plan — read, title, store, push — shared by
 * `hsp add` and `hsp stack`, which is `add` run once per step.
 */
export async function storeOnePlan(
	file: string | undefined,
	options: AddOptions,
	scope: Scope,
	dependsOn?: string,
): Promise<StoredResult> {
	const source = await readSource(file, options);
	if (source.format === "html") assertValidCustomHtml(source.raw);

	// Markdown sources may carry their own frontmatter; keep the parts we don't own.
	const parsed =
		source.format === "md"
			? readSourceFrontmatter(source.raw)
			: { data: {}, content: source.raw, title: undefined };

	const fromFilename =
		source.path === undefined
			? undefined
			: deslugify(basename(source.path).replace(/\.[^.]+$/, ""));
	const fromBody =
		source.format === "md" ? titleFromMarkdown(parsed.content) : titleFromHtml(parsed.content);

	const title = options.title ?? parsed.title ?? fromBody ?? fromFilename ?? "Untitled Plan";
	const project = options.project ?? scope.project;
	const branch = options.branch ?? scope.branch;
	const status = parseStatus(options.status);
	const sourceTheme = "theme" in parsed ? parsed.theme : undefined;
	const requestedTheme = options.theme ?? sourceTheme;
	if (requestedTheme !== undefined && !isPlanTheme(requestedTheme)) {
		die(`--theme must be one of ${PLAN_THEME_IDS.join(", ")}, got \`${String(requestedTheme)}\``);
	}

	const input: AddPlanInput = {
		content: parsed.content,
		title,
		project,
		branch,
		format: source.format,
		// Private unless publishing is asked for explicitly.
		visibility: options.public === true ? "public" : "private",
		cwd: scope.root,
		...(status === undefined ? {} : { status }),
		...(requestedTheme === undefined ? {} : { theme: requestedTheme }),
		...(dependsOn === undefined ? {} : { dependsOn }),
		...(source.path === undefined ? {} : { source: source.path }),
		...(Object.keys(parsed.data).length === 0 ? {} : { extraFrontmatter: parsed.data }),
	};

	const plan = await addPlan(input);

	// Local first, then push. A plan that exists on disk but failed to upload is
	// a warning; losing the plan because the network blipped is not acceptable.
	const remote = options.local === true ? undefined : await currentRemote();
	let pushed: RemotePlan | undefined;
	if (remote !== undefined) {
		try {
			pushed = await push(remote, {
				content: input.content,
				title,
				project,
				branch,
				format: source.format,
				visibility: plan.meta.visibility,
				id: plan.meta.id,
				...(plan.meta.code === undefined ? {} : { code: plan.meta.code }),
				...(status === undefined ? {} : { status }),
				theme: plan.meta.theme,
				...(dependsOn === undefined ? {} : { dependsOn }),
			});
		} catch (error) {
			warn(`stored locally but not pushed — ${(error as Error).message}`);
		}
	}

	// Only bother starting the local viewer when there is no deployment to link to.
	const port =
		pushed === undefined && options.serve ? (await ensureServer()).port : await resolvePort();

	// The deployment builds its own links; locally we build them from the port.
	const links =
		pushed === undefined
			? shareUrls(`http://localhost:${port}`, plan.meta)
			: {
					url: pushed.url,
					...(pushed.codedUrl === undefined ? {} : { codedUrl: pushed.codedUrl }),
				};

	return {
		plan,
		meta: pushed ?? plan.meta,
		links,
		...(remote === undefined ? {} : { remoteUrl: remote.url }),
	};
}

export function storedLine(title: string, scope: string, id: string, extra: string): string {
	return `${style.green("✓")} stored  ${style.bold(title)}  ${style.dim("·")}  ${scope}  ${style.dim("·")}  ${style.cyan(id)}  ${style.dim("·")}  ${extra}`;
}

export async function addCommand(file: string | undefined, options: AddOptions): Promise<void> {
	// Always detect: even when project and branch are overridden we want the real
	// repo root, since that's where an "Open in…" deep link has to land.
	const scope = await detectScope();
	const project = options.project ?? scope.project;
	const branch = options.branch ?? scope.branch;

	// `--after` accepts an id or a pasted URL; the plan has to exist so a typo
	// can't quietly create a stack pointing at nothing.
	let dependsOn: string | undefined;
	if (options.after !== undefined) {
		dependsOn = (await resolveRef(options.after, {})).meta.id;
	}

	const { plan, meta, links, remoteUrl } = await storeOnePlan(file, options, scope, dependsOn);

	if (options.json === true) {
		printJson({ ...meta, ...links, path: plan.path, remote: remoteUrl ?? null });
		return;
	}

	if (options.quiet === true) {
		// The link that actually opens, so `$(hsp add -q ...)` is usable as-is.
		process.stdout.write(`${links.codedUrl ?? links.url}\n`);
	} else {
		if (projectDirName(project) !== slugify(project)) {
			warn(
				`\`${project}\` collides with a web route — stored under \`${projectDirName(project)}\``,
			);
		}
		const lines = [
			storedLine(
				plan.meta.title,
				`${project} / ${branch}`,
				meta.id,
				`${meta.visibility}${dependsOn === undefined ? "" : `  ${style.dim("·")}  after ${style.cyan(dependsOn)}`}`,
			),
			links.codedUrl === undefined
				? `${style.dim("→")} ${style.blue(links.url)}`
				: `${style.dim("→")} ${style.blue(links.url)}  ${style.dim("asks for the code")}`,
			...(links.codedUrl === undefined
				? []
				: [`${style.dim("→")} ${style.blue(links.codedUrl)}  ${style.dim("opens directly")}`]),
			`  ${style.dim(displayPath(plan.path))}`,
		];
		process.stdout.write(`${lines.join("\n")}\n`);
	}

	if (options.open === true) openInBrowser(links.codedUrl ?? links.url);
}
