import type { Metadata } from "next";
import { Heartbeat } from "@/components/Heartbeat";
import Providers from "./providers";
import "./globals.css";
import "./wafuu-theme.css";

export const metadata: Metadata = {
	title: "将棋ゲーム",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="ja">
			<body>
				<Providers>
					<Heartbeat />
					{children}
				</Providers>
			</body>
		</html>
	);
}
