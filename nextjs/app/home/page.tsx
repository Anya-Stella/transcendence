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
		<div>
			<header className="header">
				<div className="header-logo">🐯 虎戦</div>
				<div className="header-user">
					{user && (
						<>
							<span className="header-username">{user.name}</span>
							<button className="btn btn-outline btn-sm" onClick={handleLogout}>
								ログアウト
							</button>
						</>
					)}
				</div>
			</header>

			<div className="page page-top">
				<h2
					style={{
						fontSize: "1.5rem",
						fontWeight: 700,
						marginBottom: "24px",
						textAlign: "center",
					}}
				>
					あそびかたを選ぼう
				</h2>

				<div className="menu-list" style={{ maxWidth: "420px" }}>
					<Link href="/online" className="menu-item">
						<span className="menu-item-icon">⚔️</span>
						<div className="menu-item-content">
							<div className="menu-item-title">オンライン対戦</div>
							<div className="menu-item-desc">
								ルームを作成して友達と対戦しよう
							</div>
						</div>
						<span className="menu-item-arrow">→</span>
					</Link>

					<Link href="/match" className="menu-item">
						<span className="menu-item-icon">🤖</span>
						<div className="menu-item-content">
							<div className="menu-item-title">AI対戦</div>
							<div className="menu-item-desc">
								コンピュータと練習しよう（準備中）
							</div>
						</div>
						<span className="menu-item-arrow">→</span>
					</Link>

					<Link href="/spectate" className="menu-item">
						<span className="menu-item-icon">👁️</span>
						<div className="menu-item-content">
							<div className="menu-item-title">観戦する</div>
							<div className="menu-item-desc">
								他のプレイヤーの対局を見よう
							</div>
						</div>
						<span className="menu-item-arrow">→</span>
					</Link>
				</div>
			</div>
		</div>
	);
}
