/**
 * Filesystem-safe name. Used for both directory names (project, branch) and the
 * trailing part of a plan filename, so it has to survive `feat/delivery`,
 * spaces, emoji, and leading dots.
 */
export function slugify(input: string, fallback = "untitled"): string {
	const slug = input
		.normalize("NFKD")
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, "-")
		.replace(/-{2,}/g, "-")
		.replace(/^[-._]+|[-._]+$/g, "");
	return slug.length > 0 ? slug.slice(0, 60) : fallback;
}

/** `worktree-gc` -> `Worktree Gc`. Only used as a last-resort title. */
export function deslugify(input: string): string {
	const words = input
		.replace(/[-_.]+/g, " ")
		.trim()
		.split(/\s+/)
		.filter((word) => word.length > 0);
	if (words.length === 0) return "";
	return words.map((word) => (word[0] ?? "").toUpperCase() + word.slice(1)).join(" ");
}

/** First ATX heading in a markdown body, if there is one. */
export function titleFromMarkdown(body: string): string | undefined {
	const match = body.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/m);
	const heading = match?.[1]?.trim();
	return heading !== undefined && heading.length > 0 ? heading : undefined;
}

/** `<title>` or the first `<h1>` of an HTML document. */
export function titleFromHtml(body: string): string | undefined {
	const title = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
	const heading = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
	const raw = title ?? heading;
	if (raw === undefined) return undefined;
	const text = raw.replace(/<[^>]+>/g, "").trim();
	return text.length > 0 ? text : undefined;
}
