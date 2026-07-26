import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
	title: "hostplan",
	description: "A central store for agent plans.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" className={cn("font-sans", geist.variable)}>
			<body className="font-sans antialiased">{children}</body>
		</html>
	);
}
