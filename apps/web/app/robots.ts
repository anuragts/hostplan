import type { MetadataRoute } from "next";
import { PUBLIC_ROUTES, SITE_URL } from "@/lib/site";

const privateRoutes = ["/api/", "/p/", "/login", "/cli", "/settings/"];

export default function robots(): MetadataRoute.Robots {
	const publicRoutes = [...PUBLIC_ROUTES];
	return {
		rules: [
			{
				userAgent: "*",
				allow: publicRoutes,
				disallow: privateRoutes,
			},
			{
				userAgent: "OAI-SearchBot",
				allow: publicRoutes,
				disallow: privateRoutes,
			},
		],
		sitemap: `${SITE_URL}/sitemap.xml`,
		host: SITE_URL,
	};
}
