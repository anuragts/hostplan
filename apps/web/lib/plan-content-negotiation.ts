const HTML_MEDIA_TYPES = new Set(["text/html", "application/xhtml+xml"]);
const SOURCE_MEDIA_TYPES = new Set(["text/markdown", "text/plain", "*/*"]);

function acceptedMediaTypes(header: string): Set<string> {
	const accepted = new Set<string>();

	for (const part of header.split(",")) {
		const [rawMediaType, ...parameters] = part.split(";");
		const mediaType = rawMediaType?.trim().toLowerCase();
		if (mediaType === undefined || mediaType.length === 0) continue;

		const quality = parameters
			.map((parameter) => parameter.trim().toLowerCase())
			.find((parameter) => parameter.startsWith("q="));
		const weight = quality === undefined ? 1 : Number.parseFloat(quality.slice(2));
		if (Number.isFinite(weight) && weight > 0) accepted.add(mediaType);
	}

	return accepted;
}

/**
 * A plan URL has two representations: the rendered viewer for browsers and
 * the stored source for command-line readers. Next's own RSC requests must
 * always stay on the viewer path, even though their Accept header is broad.
 */
export function wantsPlanSource(headers: Headers): boolean {
	if (
		headers.get("rsc") === "1" ||
		headers.has("next-router-state-tree") ||
		headers.has("next-router-prefetch")
	) {
		return false;
	}

	const accept = headers.get("accept");
	if (accept === null || accept.trim().length === 0) return true;

	const mediaTypes = acceptedMediaTypes(accept);
	if ([...HTML_MEDIA_TYPES].some((mediaType) => mediaTypes.has(mediaType))) return false;
	return [...SOURCE_MEDIA_TYPES].some((mediaType) => mediaTypes.has(mediaType));
}

/** Headers that can select a different representation of the same plan URL. */
export const PLAN_REPRESENTATION_VARY = "Accept, RSC, Next-Router-State-Tree, Next-Router-Prefetch";
