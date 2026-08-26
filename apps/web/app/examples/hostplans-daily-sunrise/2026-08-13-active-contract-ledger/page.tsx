import type { Metadata } from "next";
import { ACTIVE_CONTRACT_ARTICLE, DailySunriseArticle } from "@/features/hostplans-daily-sunrise";
import { pageMetadata, SITE_URL } from "@/lib/site";

const baseMetadata = pageMetadata({
	title: ACTIVE_CONTRACT_ARTICLE.title,
	description: ACTIVE_CONTRACT_ARTICLE.description,
	path: ACTIVE_CONTRACT_ARTICLE.path,
});

export const metadata: Metadata = {
	...baseMetadata,
	openGraph: {
		...baseMetadata.openGraph,
		type: "article",
		publishedTime: `${ACTIVE_CONTRACT_ARTICLE.published}T00:00:00.000Z`,
		modifiedTime: `${ACTIVE_CONTRACT_ARTICLE.updated}T00:00:00.000Z`,
		images: [
			{
				url: `${SITE_URL}${ACTIVE_CONTRACT_ARTICLE.imagePath}`,
				width: 1200,
				height: 675,
				alt: "The five fields of an active-contract ledger for resumable coding-agent work.",
			},
		],
	},
	twitter: {
		...baseMetadata.twitter,
		images: [`${SITE_URL}${ACTIVE_CONTRACT_ARTICLE.imagePath}`],
	},
};

export default function ActiveContractLedgerPage() {
	return <DailySunriseArticle />;
}
