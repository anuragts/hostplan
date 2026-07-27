import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION } from "@/lib/site";

export const alt = "Hostplan — share coding-agent plans";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
	return new ImageResponse(
		<div
			style={{
				alignItems: "stretch",
				background: "#28272c",
				color: "#edecef",
				display: "flex",
				flexDirection: "column",
				fontFamily: "sans-serif",
				height: "100%",
				justifyContent: "space-between",
				padding: "72px 84px",
				width: "100%",
			}}
		>
			<div style={{ color: "#65d9df", display: "flex", fontFamily: "monospace", fontSize: 34 }}>
				hostplan
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
				<div
					style={{
						display: "flex",
						fontSize: 72,
						fontWeight: 650,
						letterSpacing: "-3px",
						lineHeight: 1.04,
						maxWidth: 950,
					}}
				>
					A home for the plans your coding agents write.
				</div>
				<div
					style={{
						color: "#aaa8b1",
						display: "flex",
						fontSize: 28,
						lineHeight: 1.35,
						maxWidth: 930,
					}}
				>
					{SITE_DESCRIPTION}
				</div>
			</div>
			<div
				style={{
					alignItems: "center",
					border: "1px solid #48474f",
					borderRadius: 14,
					display: "flex",
					fontFamily: "monospace",
					fontSize: 23,
					gap: 16,
					padding: "18px 22px",
					alignSelf: "flex-start",
				}}
			>
				<span style={{ color: "#65d9df" }}>$</span>
				<span>hsp add PLAN.md</span>
				<span style={{ color: "#77757f" }}>→ one durable URL</span>
			</div>
		</div>,
		size,
	);
}
