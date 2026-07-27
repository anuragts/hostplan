import type { MetadataRoute } from "next";
import { absoluteUrl, PUBLIC_ROUTES, SITE_UPDATED } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
	const lastModified = new Date(`${SITE_UPDATED}T00:00:00.000Z`);
	return PUBLIC_ROUTES.map((path) => ({
		url: absoluteUrl(path),
		lastModified,
		changeFrequency: path === "/" ? "weekly" : "monthly",
		priority: path === "/" ? 1 : path === "/coding-agent-plans" ? 0.9 : 0.7,
	}));
}
