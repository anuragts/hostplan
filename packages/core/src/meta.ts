import { randomUUID } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import matter from "gray-matter";
import type { Visibility } from "./access";
import { normalizeCode } from "./code";
import { isId } from "./id";
import { DEFAULT_STATUS, isStatus, type PlanStatus } from "./status";

export type PlanFormat = "md" | "html";

export interface PlanMeta {
	id: string;
	title: string;
	/** Raw project name — the directory it lives in may be a slugified version. */
	project: string;
	/** Raw branch name, e.g. `feat/delivery`. The directory is `feat-delivery`. */
	branch: string;
	format: PlanFormat;
	created: string;
	updated: string;
	/** Who may read this once it's hosted. Private is the default everywhere. */
	visibility: Visibility;
	/** Where the plan is in its life. New plans start as drafts. */
	status: PlanStatus;
	/**
	 * Id of the plan this one waits on. A plan is blocked until its dependency
	 * is `done` — this is what chains a stack of plans together.
	 */
	dependsOn?: string;
	/** 4-letter share code. Only present on private plans. */
	code?: string;
	/** Absolute path of the file this plan was added from, when there was one. */
	source?: string;
	/** Project root the plan was written for. Deep links open the app here. */
	cwd?: string;
}

export interface Plan {
	meta: PlanMeta;
	body: string;
	/** Absolute path inside the store. */
	path: string;
}

/** Frontmatter keys hostplan owns; anything else in a source file is passed through. */
const OWNED_KEYS = [
	"hostplan_id",
	"title",
	"project",
	"branch",
	"format",
	"created",
	"updated",
	"source",
	"cwd",
	"visibility",
	"code",
	"status",
	"depends_on",
] as const;

const HTML_META_PATTERN = /^<!--hostplan\s+([\s\S]*?)-->\n?/;

function metaToRecord(meta: PlanMeta): Record<string, unknown> {
	return {
		hostplan_id: meta.id,
		title: meta.title,
		project: meta.project,
		branch: meta.branch,
		format: meta.format,
		created: meta.created,
		updated: meta.updated,
		// Never emit undefined: the YAML dumper throws on it, and a plan that
		// can't be written is worse than one that defaults to private.
		visibility: meta.visibility ?? "private",
		status: meta.status ?? DEFAULT_STATUS,
		...(meta.dependsOn === undefined ? {} : { depends_on: meta.dependsOn }),
		...(meta.code === undefined ? {} : { code: meta.code }),
		...(meta.source === undefined ? {} : { source: meta.source }),
		...(meta.cwd === undefined ? {} : { cwd: meta.cwd }),
	};
}

function recordToMeta(record: Record<string, unknown>, fallbackFormat: PlanFormat): PlanMeta {
	const str = (key: string): string | undefined => {
		const value = record[key];
		return typeof value === "string" && value.length > 0 ? value : undefined;
	};
	const format = str("format");
	const source = str("source");
	const cwd = str("cwd");
	// Plans written before visibility existed are treated as private — the safe
	// direction to be wrong in.
	const visibility = str("visibility") === "public" ? "public" : "private";
	const code = normalizeCode(str("code"));
	// Plans written before status existed are drafts; a hand-edited value that
	// isn't a real status falls back the same way rather than failing the parse.
	const rawStatus = record.status;
	const status = isStatus(rawStatus) ? rawStatus : DEFAULT_STATUS;
	const dependsOnRaw = str("depends_on");
	const dependsOn = dependsOnRaw !== undefined && isId(dependsOnRaw) ? dependsOnRaw : undefined;
	return {
		id: str("hostplan_id") ?? "",
		title: str("title") ?? "Untitled Plan",
		project: str("project") ?? "unknown",
		branch: str("branch") ?? "unknown",
		format: format === "html" || format === "md" ? format : fallbackFormat,
		created: str("created") ?? new Date(0).toISOString(),
		updated: str("updated") ?? str("created") ?? new Date(0).toISOString(),
		visibility,
		status,
		...(dependsOn === undefined ? {} : { dependsOn }),
		...(code === undefined ? {} : { code }),
		...(source === undefined ? {} : { source }),
		...(cwd === undefined ? {} : { cwd }),
	};
}

/**
 * HTML documents can't carry YAML frontmatter, so metadata rides in a leading
 * comment instead. `>` is escaped so a title can never terminate the comment early.
 */
function encodeHtmlMeta(meta: PlanMeta): string {
	const json = JSON.stringify(metaToRecord(meta)).replace(/>/g, "\\u003e");
	return `<!--hostplan ${json}-->\n`;
}

export function serializePlan(
	meta: PlanMeta,
	body: string,
	extraFrontmatter: Record<string, unknown> = {},
): string {
	if (meta.format === "html") {
		return encodeHtmlMeta(meta) + body;
	}
	return matter.stringify(body, { ...extraFrontmatter, ...metaToRecord(meta) });
}

export function parsePlan(raw: string, format: PlanFormat): { meta: PlanMeta; body: string } {
	if (format === "html") {
		const match = raw.match(HTML_META_PATTERN);
		if (match?.[1] === undefined) {
			return { meta: recordToMeta({}, "html"), body: raw };
		}
		try {
			const record = JSON.parse(match[1]) as Record<string, unknown>;
			return { meta: recordToMeta(record, "html"), body: raw.slice(match[0].length) };
		} catch {
			return { meta: recordToMeta({}, "html"), body: raw.slice(match[0].length) };
		}
	}
	const parsed = matter(raw);
	return { meta: recordToMeta(parsed.data, "md"), body: parsed.content };
}

/**
 * Splits a *source* file into its body and any frontmatter worth carrying
 * forward — hostplan's own keys are dropped, since we're about to rewrite them.
 */
export function readSourceFrontmatter(raw: string): {
	data: Record<string, unknown>;
	content: string;
	title?: string;
} {
	let parsed: matter.GrayMatterFile<string>;
	try {
		parsed = matter(raw);
	} catch {
		// Malformed YAML in someone else's file shouldn't stop us storing their plan.
		return { data: {}, content: raw };
	}
	const data: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(parsed.data)) {
		if (!(OWNED_KEYS as readonly string[]).includes(key)) data[key] = value;
	}
	const title = parsed.data.title;
	const base = { data, content: parsed.content };
	return typeof title === "string" && title.length > 0 ? { ...base, title } : base;
}

export function formatFromPath(path: string): PlanFormat {
	return /\.html?$/i.test(path) ? "html" : "md";
}

export async function readPlanFile(path: string): Promise<Plan> {
	const raw = await readFile(path, "utf8");
	const { meta, body } = parsePlan(raw, formatFromPath(path));
	return { meta, body, path };
}

/**
 * Write via tmp + rename so a concurrent reader never sees a half-written plan.
 * The tmp name has to be unique per *write*, not per process — several adds can
 * land inside the same millisecond.
 */
export async function writeFileAtomic(path: string, contents: string): Promise<void> {
	const tmp = join(dirname(path), `.${process.pid}-${randomUUID()}.tmp`);
	await writeFile(tmp, contents, "utf8");
	await rename(tmp, path);
}
