import type { MetadataRoute } from "next";
import {
	ACTIVE_CONTRACT_ARTICLE_PATH,
	absoluteUrl,
	CROSS_SESSION_HANDOFF_ARTICLE_PATH,
	PUBLIC_ROUTES,
	SITE_UPDATED,
} from "@/lib/site";

const DAILY_SUNRISE_UPDATED = new Map<string, string>([
	[ACTIVE_CONTRACT_ARTICLE_PATH, "2026-08-13"],
	[CROSS_SESSION_HANDOFF_ARTICLE_PATH, "2026-08-14"],
]);

export default function sitemap(): MetadataRoute.Sitemap {
	return PUBLIC_ROUTES.map((path) => ({
		url: absoluteUrl(path),
		lastModified: new Date(`${DAILY_SUNRISE_UPDATED.get(path) ?? SITE_UPDATED}T00:00:00.000Z`),
		changeFrequency: path === "/" ? "weekly" : "monthly",
		priority: path === "/" ? 1 : path === "/coding-agent-plans" ? 0.9 : 0.7,
	}));
}
