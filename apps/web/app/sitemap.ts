import type { MetadataRoute } from "next";
import { absoluteUrl, DAILY_SUNRISE_PATH, PUBLIC_ROUTES, SITE_UPDATED } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
	return PUBLIC_ROUTES.map((path) => ({
		url: absoluteUrl(path),
		lastModified: new Date(
			`${path === DAILY_SUNRISE_PATH ? "2026-08-13" : SITE_UPDATED}T00:00:00.000Z`,
		),
		changeFrequency: path === "/" ? "weekly" : "monthly",
		priority: path === "/" ? 1 : path === "/coding-agent-plans" ? 0.9 : 0.7,
	}));
}
