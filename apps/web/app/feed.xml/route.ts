import {
	DAILY_SUNRISE_ARTICLE,
	DAILY_SUNRISE_ARTICLE_URL,
} from "@/features/hostplans-daily-sunrise";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

function escapeXml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

export function GET() {
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${SITE_NAME} Daily Sunrise`)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${new Date(`${DAILY_SUNRISE_ARTICLE.updated}T00:00:00.000Z`).toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <item>
      <title>${escapeXml(DAILY_SUNRISE_ARTICLE.title)}</title>
      <link>${DAILY_SUNRISE_ARTICLE_URL}</link>
      <guid isPermaLink="true">${DAILY_SUNRISE_ARTICLE_URL}</guid>
      <pubDate>${new Date(`${DAILY_SUNRISE_ARTICLE.published}T00:00:00.000Z`).toUTCString()}</pubDate>
      <description>${escapeXml(DAILY_SUNRISE_ARTICLE.description)}</description>
    </item>
  </channel>
</rss>`;

	return new Response(body, {
		headers: {
			"Content-Type": "application/rss+xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600, s-maxage=86400",
		},
	});
}
