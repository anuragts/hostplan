import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import {
	type AddPlanInput,
	addPlan,
	deslugify,
	detectScope,
	displayPath,
	formatFromPath,
	type PlanFormat,
	projectDirName,
	readSourceFrontmatter,
	resolvePort,
	shareUrls,
	slugify,
	titleFromHtml,
	titleFromMarkdown,
} from "@hostplan/core";
import { ensureServer } from "../daemon";
import { die, printJson, style, warn } from "../output";
import { currentRemote, push, type RemotePlan } from "../remote";
import { openInBrowser } from "./shared";

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
}

function parseFormat(value: string | undefined, fallback: PlanFormat): PlanFormat {
	if (value === undefined) return fallback;
	if (value === "md" || value === "html") return value;
	return die(`--format must be \`md\` or \`html\`, got \`${value}\``);
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

export async function addCommand(file: string | undefined, options: AddOptions): Promise<void> {
	const source = await readSource(file, options);

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

	// Always detect: even when project and branch are overridden we want the real
	// repo root, since that's where an "Open in…" deep link has to land.
	const scope = await detectScope();
	const project = options.project ?? scope.project;
	const branch = options.branch ?? scope.branch;

	const input: AddPlanInput = {
		content: parsed.content,
		title,
		project,
		branch,
		format: source.format,
		// Private unless publishing is asked for explicitly.
		visibility: options.public === true ? "public" : "private",
		cwd: scope.root,
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
	const meta = pushed ?? plan.meta;

	if (options.json === true) {
		printJson({ ...meta, ...links, path: plan.path, remote: remote?.url ?? null });
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
			`${style.green("✓")} stored  ${style.bold(title)}  ${style.dim("·")}  ${project} / ${branch}  ${style.dim("·")}  ${style.cyan(meta.id)}  ${style.dim("·")}  ${meta.visibility}`,
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
