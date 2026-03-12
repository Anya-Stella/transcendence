"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
	id: string;
	name: string;
	email: string;
}

export default function HomePage() {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		fetch("/api/me")
			.then((res) => res.json())
			.then((data) => {
				if (data.user) setUser(data.user);
			})
			.catch(() => { });
	}, []);

	const handleLogout = async () => {
		await fetch("/api/auth/logout", { method: "POST" });
		router.push("/login");
		router.refresh();
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
						<span className="wafuu-header-username">{user.name}</span>
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
								コンピュータと練習しよう（準備中）
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
				</div>
			</div>
		</div>
	);
}
