import type { Metadata } from "next";
import Link from "next/link";
import { Heartbeat } from "@/components/Heartbeat";
import Providers from "./providers";
import "./globals.css";
import "./wafuu-theme.css";
import "./footer.css";

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
					<footer className="site-footer">
						<div className="site-footer-links">
							<Link href="/privacy" className="site-footer-link">
								プライバシーポリシー
							</Link>
							<span className="site-footer-divider">|</span>
							<Link href="/terms" className="site-footer-link">
								利用規約
							</Link>
						</div>
						<span className="site-footer-copy">
							© 2026 将棋ゲーム All rights reserved.
						</span>
					</footer>
				</Providers>
			</body>
		</html>
	);
}

