export function JsonLd({ value }: { value: Record<string, unknown> }) {
	return (
		<script
			type="application/ld+json"
			// JSON-LD is generated from trusted constants, and escaping `<` prevents
			// a future string from prematurely closing the script element.
			// biome-ignore lint/security/noDangerouslySetInnerHtml: safe structured data serialization
			dangerouslySetInnerHTML={{ __html: JSON.stringify(value).replaceAll("<", "\\u003c") }}
		/>
	);
}
