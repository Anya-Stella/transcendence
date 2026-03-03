import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "虎戦 — 5×5将棋オンライン",
	description: "5×5ミニ将棋をオンラインで対戦できるWebアプリ",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="ja">
			<body>{children}</body>
		</html>
	);
}
