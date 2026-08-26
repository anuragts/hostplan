import type { Metadata } from "next";
import {
	CROSS_SESSION_HANDOFF_ARTICLE,
	CrossSessionHandoffArticle,
} from "@/features/hostplans-daily-sunrise";
import { pageMetadata, SITE_URL } from "@/lib/site";

const baseMetadata = pageMetadata({
	title: CROSS_SESSION_HANDOFF_ARTICLE.title,
	description: CROSS_SESSION_HANDOFF_ARTICLE.description,
	path: CROSS_SESSION_HANDOFF_ARTICLE.path,
});

export const metadata: Metadata = {
	...baseMetadata,
	openGraph: {
		...baseMetadata.openGraph,
		type: "article",
		publishedTime: `${CROSS_SESSION_HANDOFF_ARTICLE.published}T00:00:00.000Z`,
		modifiedTime: `${CROSS_SESSION_HANDOFF_ARTICLE.updated}T00:00:00.000Z`,
		images: [
			{
				url: SITE_URL + CROSS_SESSION_HANDOFF_ARTICLE.imagePath,
				width: 1200,
				height: 675,
				alt: "A durable plan carrying verified state between two coding-agent sessions.",
			},
		],
	},
	twitter: {
		...baseMetadata.twitter,
		images: [SITE_URL + CROSS_SESSION_HANDOFF_ARTICLE.imagePath],
	},
};

export default function CrossSessionHandoffPage() {
	return <CrossSessionHandoffArticle />;
}
