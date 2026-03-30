"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function HomePage() {
	const router = useRouter();
	const { data: session } = useSession();
	const user = session?.user;

	const handleLogout = async () => {
		await signOut({ callbackUrl: "/login" });
	};

	return (
		<div className="wafuu-page">
			{/* 背景 */}
			<div
				className="wafuu-bg"
				style={{ backgroundImage: "url(/images/home-bg.png)" }}
			/>

			{/* ヘッダー */}
			<header className="wafuu-header">
				<div className="wafuu-header-logo">将棋ゲーム</div>
				<div className="wafuu-header-right">
					{user && (
						<Link href="/profile" className="wafuu-header-username" style={{ cursor: "pointer", textDecoration: "underline" }}>
							{user.name}
						</Link>
					)}
					<button
						className="wafuu-header-btn"
						onClick={handleLogout}
					>
						ログアウト
					</button>
				</div>
			</header>

			{/* コンテンツ */}
			<div className="wafuu-content">

				<div className="wafuu-menu">
					<Link href="/online" className="wafuu-menu-item">
						<div className="wafuu-menu-text">
							<div className="wafuu-menu-title">オンライン対戦</div>
							<div className="wafuu-menu-desc">
								ルームを作成して友達と対戦しよう
							</div>
						</div>
						<span className="wafuu-menu-arrow">→</span>
					</Link>

					<Link href="/match" className="wafuu-menu-item">
						<div className="wafuu-menu-text">
							<div className="wafuu-menu-title">AI対戦</div>
							<div className="wafuu-menu-desc">
								コンピュータと練習しよう
							</div>
						</div>
						<span className="wafuu-menu-arrow">→</span>
					</Link>

					<Link href="/spectate" className="wafuu-menu-item">
						<div className="wafuu-menu-text">
							<div className="wafuu-menu-title">観戦する</div>
							<div className="wafuu-menu-desc">
								他のプレイヤーの対局を見よう
							</div>
						</div>
						<span className="wafuu-menu-arrow">→</span>
					</Link>

					<Link href="/friends" className="wafuu-menu-item">
						<div className="wafuu-menu-text">
							<div className="wafuu-menu-title">フレンド</div>
							<div className="wafuu-menu-desc">
								友達を探して追加・管理しよう
							</div>
						</div>
						<span className="wafuu-menu-arrow">→</span>
					</Link>
				</div>z
			</div>
		</div>
	);
}
