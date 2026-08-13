import type { Metadata } from "next";
import { DAILY_SUNRISE_ARTICLE, DailySunriseArticle } from "@/features/hostplans-daily-sunrise";
import { pageMetadata, SITE_URL } from "@/lib/site";

const baseMetadata = pageMetadata({
	title: DAILY_SUNRISE_ARTICLE.title,
	description: DAILY_SUNRISE_ARTICLE.description,
	path: DAILY_SUNRISE_ARTICLE.path,
});

export const metadata: Metadata = {
	...baseMetadata,
	openGraph: {
		...baseMetadata.openGraph,
		type: "article",
		publishedTime: `${DAILY_SUNRISE_ARTICLE.published}T00:00:00.000Z`,
		modifiedTime: `${DAILY_SUNRISE_ARTICLE.updated}T00:00:00.000Z`,
		images: [
			{
				url: `${SITE_URL}${DAILY_SUNRISE_ARTICLE.imagePath}`,
				width: 1200,
				height: 675,
				alt: "The five fields of an active-contract ledger for resumable coding-agent work.",
			},
		],
	},
	twitter: {
		...baseMetadata.twitter,
		images: [`${SITE_URL}${DAILY_SUNRISE_ARTICLE.imagePath}`],
	},
};

export default function ActiveContractLedgerPage() {
	return <DailySunriseArticle />;
}
