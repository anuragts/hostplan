"use client";

import { useEffect } from "react";

let configured = false;

function markUnavailable(node: HTMLElement): void {
	node.replaceChildren("This diagram could not be rendered.");
	node.dataset.mermaidState = "error";
	node.setAttribute("aria-busy", "false");
	node.setAttribute("aria-label", "Diagram unavailable");
	node.setAttribute("role", "status");
	node.removeAttribute("tabindex");
}

function decodeDataUrl(source: string): string | null {
	const separator = source.indexOf(",");
	if (!source.startsWith("data:text/html") || separator === -1) return null;

	const metadata = source.slice(0, separator);
	const payload = source.slice(separator + 1);
	if (!metadata.endsWith(";base64")) return decodeURIComponent(payload);

	const bytes = Uint8Array.from(atob(payload), (character) => character.charCodeAt(0));
	return new TextDecoder().decode(bytes);
}

const unsafeCss = /@import|expression\s*\(|javascript:|url\s*\(\s*["']?(?:https?:|data:|\/\/)/i;
const safeHtmlElements = new Set([
	"b",
	"br",
	"code",
	"div",
	"em",
	"i",
	"p",
	"small",
	"span",
	"strong",
	"sub",
	"sup",
]);

function sanitizeDiagramSvg(svg: SVGSVGElement): void {
	for (const element of svg.querySelectorAll("base, embed, iframe, link, meta, object, script")) {
		element.remove();
	}

	for (const foreignObject of svg.querySelectorAll("foreignObject")) {
		for (const element of Array.from(foreignObject.querySelectorAll("*")).reverse()) {
			if (!safeHtmlElements.has(element.localName.toLowerCase())) {
				element.replaceWith(element.ownerDocument.createTextNode(element.textContent ?? ""));
			}
		}
	}

	for (const style of svg.querySelectorAll("style")) {
		if (unsafeCss.test(style.textContent ?? "")) style.remove();
	}

	for (const element of [svg, ...svg.querySelectorAll("*")]) {
		for (const attribute of Array.from(element.attributes)) {
			const name = attribute.name.toLowerCase();
			if (
				name.startsWith("on") ||
				name === "action" ||
				name === "formaction" ||
				name === "src" ||
				name === "srcdoc" ||
				(name === "style" && unsafeCss.test(attribute.value))
			) {
				element.removeAttribute(attribute.name);
				continue;
			}
			if ((name === "href" || name.endsWith(":href")) && !attribute.value.trim().startsWith("#")) {
				element.removeAttribute(attribute.name);
			}
		}
	}
}

function parseRenderedSvg(markup: string): SVGSVGElement | null {
	const rendered = new DOMParser().parseFromString(markup, "text/html");
	const existing = rendered.querySelector<SVGSVGElement>("svg");
	if (existing !== null) return existing;

	const frame = rendered.querySelector<HTMLIFrameElement>("iframe");
	const source = frame?.getAttribute("src");
	if (source === null || source === undefined) return null;

	const html = decodeDataUrl(source);
	if (html === null) return null;

	const parsed = new DOMParser().parseFromString(html, "text/html");
	return parsed.querySelector<SVGSVGElement>("svg");
}

function promoteRenderedSvg(node: HTMLElement, markup: string): SVGSVGElement | null {
	const svg = parseRenderedSvg(markup);
	if (svg === null) return null;

	sanitizeDiagramSvg(svg);
	const promoted = document.importNode(svg, true);
	promoted.removeAttribute("height");
	promoted.removeAttribute("width");
	promoted.style.removeProperty("max-width");
	promoted.setAttribute("preserveAspectRatio", "xMidYMid meet");
	node.replaceChildren(promoted);
	return promoted;
}

export function MermaidRenderer({ containerId }: { containerId: string }) {
	useEffect(() => {
		const container = document.getElementById(containerId);
		if (container === null) return;

		const nodes = Array.from(
			container.querySelectorAll<HTMLElement>('.plan-mermaid[data-mermaid-state="loading"]'),
		);
		if (nodes.length === 0) return;

		for (const node of nodes) node.dataset.mermaidState = "rendering";

		void import("mermaid")
			.then(async ({ default: mermaid }) => {
				if (!configured) {
					mermaid.initialize({
						startOnLoad: false,
						securityLevel: "sandbox",
						theme: "base",
						fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
						themeVariables: {
							background: "#141414",
							primaryColor: "#191919",
							primaryTextColor: "#f5f5f7",
							primaryBorderColor: "#3a3a3e",
							secondaryColor: "#102725",
							secondaryTextColor: "#f5f5f7",
							secondaryBorderColor: "#285c59",
							tertiaryColor: "#101010",
							tertiaryTextColor: "#d1d1d6",
							tertiaryBorderColor: "#303034",
							lineColor: "#777780",
							textColor: "#f5f5f7",
							noteBkgColor: "#191919",
							noteTextColor: "#d1d1d6",
							noteBorderColor: "#3a3a3e",
							clusterBkg: "#101010",
							clusterBorder: "#303034",
							edgeLabelBackground: "#0a0a0a",
						},
						flowchart: {
							curve: "basis",
							htmlLabels: false,
							useMaxWidth: true,
						},
					});
					configured = true;
				}

				for (const node of nodes) {
					const source = node.textContent ?? "";
					try {
						const valid = await mermaid.parse(source, { suppressErrors: true });
						if (!valid) {
							markUnavailable(node);
							continue;
						}
						const rendered = await mermaid.render(
							`hostplan-mermaid-${crypto.randomUUID()}`,
							source,
						);
						const svg = promoteRenderedSvg(node, rendered.svg);
						if (
							svg === null ||
							svg.querySelector(".error-icon, .error-text") !== null ||
							svg.textContent?.includes("Syntax error in text") === true
						) {
							markUnavailable(node);
							continue;
						}
						node.dataset.mermaidState = "rendered";
						node.setAttribute("aria-busy", "false");
					} catch {
						markUnavailable(node);
					}
				}
			})
			.catch(() => {
				for (const node of nodes) markUnavailable(node);
			});
	}, [containerId]);

	return <span data-mermaid-runner="" hidden aria-hidden="true" />;
}
