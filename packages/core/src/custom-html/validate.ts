import { type DefaultTreeAdapterTypes, parse } from "parse5";
import {
	CUSTOM_HTML_KNOWN_CLASSES,
	CUSTOM_HTML_MAX_BYTES,
	CUSTOM_HTML_MODES,
	CUSTOM_HTML_PROFILE,
	CUSTOM_HTML_TONES,
} from "./profile";

export type CustomHtmlIssueLevel = "error" | "warning";

export interface CustomHtmlIssue {
	code: string;
	level: CustomHtmlIssueLevel;
	message: string;
}

export interface CustomHtmlValidation {
	valid: boolean;
	errors: CustomHtmlIssue[];
	warnings: CustomHtmlIssue[];
}

type Element = DefaultTreeAdapterTypes.Element;
type Node = DefaultTreeAdapterTypes.Node;

const PROHIBITED_ELEMENTS = new Set([
	"applet",
	"base",
	"embed",
	"form",
	"frame",
	"frameset",
	"iframe",
	"object",
	"script",
]);
const RESOURCE_ATTRIBUTES = new Set([
	"background",
	"data",
	"formaction",
	"ping",
	"poster",
	"src",
	"srcset",
]);
const EXECUTABLE_SCHEME = /^\s*(?:javascript|data|vbscript):/i;

function isElement(node: Node): node is Element {
	return "tagName" in node;
}

function descendants(node: Node, elements: Element[] = []): Element[] {
	if (isElement(node)) elements.push(node);
	if ("childNodes" in node) {
		for (const child of node.childNodes) descendants(child, elements);
	}
	if (isElement(node) && node.tagName === "template") {
		const template = node as DefaultTreeAdapterTypes.Template;
		for (const child of template.content.childNodes) descendants(child, elements);
	}
	return elements;
}

function attr(element: Element, name: string): string | undefined {
	return element.attrs.find((candidate) => candidate.name === name)?.value;
}

function textContent(node: Node): string {
	if ("value" in node) return node.value;
	if (!("childNodes" in node)) return "";
	return node.childNodes.map(textContent).join("");
}

function issue(code: string, level: CustomHtmlIssueLevel, message: string): CustomHtmlIssue {
	return { code, level, message };
}

export function validateCustomHtml(source: string): CustomHtmlValidation {
	const issues: CustomHtmlIssue[] = [];
	const addError = (code: string, message: string) => issues.push(issue(code, "error", message));
	const addWarning = (code: string, message: string) =>
		issues.push(issue(code, "warning", message));

	if (Buffer.byteLength(source, "utf8") > CUSTOM_HTML_MAX_BYTES) {
		addError("source-too-large", "Custom HTML must be 512 KiB or smaller.");
	}
	if (!/^\s*<!doctype\s+html\s*>/i.test(source)) {
		addError("missing-doctype", "Start the document with <!doctype html>.");
	}
	if (!/<head(?:\s[^>]*)?>/i.test(source)) {
		addError("missing-head", "Add an explicit <head> for metadata and styles.");
	}

	const document = parse(source);
	const elements = descendants(document);
	const html = elements.find((element) => element.tagName === "html");
	const lang = html === undefined ? undefined : attr(html, "lang")?.trim();
	if (!lang) addError("missing-language", "Set a non-empty lang attribute on <html>.");
	const mode = html === undefined ? undefined : attr(html, "data-hp-mode");
	if (!CUSTOM_HTML_MODES.includes(mode as (typeof CUSTOM_HTML_MODES)[number])) {
		addError("invalid-mode", 'Set data-hp-mode="light" or data-hp-mode="dark" on <html>.');
	}

	const title = elements.find((element) => element.tagName === "title");
	if (title === undefined || textContent(title).trim().length === 0) {
		addError("missing-title", "Add a meaningful <title> inside <head>.");
	}
	const metas = elements.filter((element) => element.tagName === "meta");
	if (!metas.some((element) => attr(element, "charset")?.toLowerCase() === "utf-8")) {
		addError("missing-charset", 'Add <meta charset="utf-8">.');
	}
	if (!metas.some((element) => attr(element, "name")?.toLowerCase() === "viewport")) {
		addError("missing-viewport", "Add viewport metadata for responsive rendering.");
	}
	const profile = metas.find(
		(element) => attr(element, "name")?.toLowerCase() === "hostplan-profile",
	);
	if (profile === undefined || attr(profile, "content") !== CUSTOM_HTML_PROFILE) {
		addError(
			"invalid-profile",
			`Add <meta name="hostplan-profile" content="${CUSTOM_HTML_PROFILE}">.`,
		);
	}

	const mains = elements.filter((element) => element.tagName === "main");
	if (mains.length !== 1) addError("invalid-main-count", "Use exactly one <main> landmark.");
	const headings = elements.filter((element) => element.tagName === "h1");
	if (headings.length === 0) addError("missing-heading", "Add one visible <h1>.");
	if (headings.length > 1) addWarning("multiple-headings", "Prefer one <h1>; use h2/h3 below it.");

	for (const element of elements) {
		if (PROHIBITED_ELEMENTS.has(element.tagName)) {
			addError("prohibited-element", `<${element.tagName}> is not allowed in custom plans.`);
		}
		if (element.tagName === "link") {
			addError("external-stylesheet", "External <link> resources are not allowed; use inline CSS.");
		}
		if (element.tagName === "meta" && attr(element, "http-equiv")?.toLowerCase() === "refresh") {
			addError("meta-refresh", "Meta refresh is not allowed.");
		}
		for (const attribute of element.attrs) {
			if (attribute.name.toLowerCase().startsWith("on")) {
				addError("event-handler", `Inline event handler ${attribute.name} is not allowed.`);
			}
			if (EXECUTABLE_SCHEME.test(attribute.value)) {
				addError("executable-url", `${attribute.name} uses a prohibited executable URL scheme.`);
			}
			if (RESOURCE_ATTRIBUTES.has(attribute.name) && attribute.value.trim().length > 0) {
				addError(
					"external-resource",
					`${attribute.name} resources are not allowed; use inline SVG.`,
				);
			}
			if (
				(attribute.name === "href" || attribute.name === "xlink:href") &&
				element.tagName !== "a" &&
				!attribute.value.trim().startsWith("#")
			) {
				addError(
					"external-resource",
					`${attribute.name} resources are not allowed; use inline SVG.`,
				);
			}
		}
	}

	const styles = elements.filter((element) => element.tagName === "style");
	const styleAttributes = elements.flatMap((element) =>
		element.attrs
			.filter((attribute) => attribute.name === "style")
			.map((attribute) => attribute.value),
	);
	const css = [...styles.map(textContent), ...styleAttributes].join("\n");
	if (styles.length > 1) addWarning("multiple-styles", "Prefer one author <style> block.");
	if (/@import\b/i.test(css)) addError("css-import", "CSS @import is not allowed.");
	if (/url\s*\(/i.test(css)) addError("css-url", "CSS url() resources are not allowed.");
	if (!/@media\s+print\b/i.test(css)) addWarning("missing-print-style", "Add @media print rules.");
	if (
		/\b(?:animation|transition)\s*:/i.test(css) &&
		!/@media\s*\([^)]*prefers-reduced-motion\s*:\s*reduce/i.test(css)
	) {
		addWarning(
			"missing-reduced-motion",
			"Motion should include a prefers-reduced-motion override.",
		);
	}

	const tableCount = elements.filter((element) => element.tagName === "table").length;
	const captionCount = elements.filter((element) => element.tagName === "caption").length;
	if (captionCount < tableCount)
		addWarning("missing-table-caption", "Give every table a <caption>.");

	const unknownClasses = new Set<string>();
	for (const element of elements) {
		for (const className of (attr(element, "class") ?? "").split(/\s+/)) {
			if (className.startsWith("hp-") && !CUSTOM_HTML_KNOWN_CLASSES.has(className)) {
				unknownClasses.add(className);
			}
		}
		const tone = attr(element, "data-tone");
		if (
			tone !== undefined &&
			!CUSTOM_HTML_TONES.includes(tone as (typeof CUSTOM_HTML_TONES)[number])
		) {
			addWarning("unknown-tone", `Unknown data-tone value "${tone}".`);
		}
	}
	if (unknownClasses.size > 0) {
		addWarning(
			"unknown-component-class",
			`Unknown Hostplan component class${unknownClasses.size === 1 ? "" : "es"}: ${[...unknownClasses].join(", ")}. Use a non-hp prefix for custom classes.`,
		);
	}

	const errors = issues.filter((candidate) => candidate.level === "error");
	const warnings = issues.filter((candidate) => candidate.level === "warning");
	return { valid: errors.length === 0, errors, warnings };
}
