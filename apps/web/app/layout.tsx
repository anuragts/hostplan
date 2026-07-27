import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Geist } from "next/font/google";
import { PostHogProvider } from "@/components/posthog-provider";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: "Hostplan — Share coding-agent plans",
		template: "%s · Hostplan",
	},
	description: SITE_DESCRIPTION,
	applicationName: SITE_NAME,
	authors: [{ name: "Hostplan project", url: "https://github.com/anuragts/hostplan" }],
	creator: "Hostplan project",
	publisher: "Hostplan project",
	alternates: { canonical: "/" },
	openGraph: {
		type: "website",
		url: "/",
		siteName: SITE_NAME,
		title: "Hostplan — Share coding-agent plans",
		description: SITE_DESCRIPTION,
		images: [
			{
				url: "/opengraph-image",
				width: 1200,
				height: 630,
				alt: "Hostplan turns coding-agent plans into shareable, machine-readable URLs.",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Hostplan — Share coding-agent plans",
		description: SITE_DESCRIPTION,
		images: ["/opengraph-image"],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-image-preview": "large",
			"max-snippet": -1,
			"max-video-preview": -1,
		},
	},
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" className={cn("font-sans antialiased", geist.variable)}>
			<body className="font-sans">
				<PostHogProvider>{children}</PostHogProvider>
			</body>
		</html>
	);
}
