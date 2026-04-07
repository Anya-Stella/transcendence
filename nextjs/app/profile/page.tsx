"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { isOnline } from "@/lib/utils";

// ───── APIから返されるユーザーデータの型 ─────
interface UserProfile {
	id: string;
	name: string | null;
	email: string | null;
	image: string | null;
	totalMatches: number;
	wins: number;
	losses: number;
	createdAt: string;
	lastSeen: string | null;
}

export default function ProfilePage() {
	const router = useRouter();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const res = await fetch("/api/me");
				if (!res.ok) {
					if (res.status === 401) {
						router.push("/login");
						return;
					}
					setError("プロフィールの取得に失敗しました");
					return;
				}
				const data = await res.json();
				setProfile(data.user);
			} catch {
				setError("通信エラーが発生しました");
			} finally {
				setLoading(false);
			}
		};
		fetchProfile();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// ───── 勝率の計算 ─────
	const winRate =
		profile && profile.totalMatches > 0
			? Math.round((profile.wins / profile.totalMatches) * 1000) / 10
			: 0;

	// ───── 日付フォーマット ─────
	const formatDate = (dateStr: string) => {
		const d = new Date(dateStr);
		return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
	};

	const online = profile ? isOnline(profile.lastSeen) : false;

	return (
		<div className="wafuu-page">
			{/* 背景 */}
			<div
				className="wafuu-bg"
				style={{ backgroundImage: "url(/images/home-bg.png)" }}
			/>

			<Header
				title="将棋ゲーム"
				pageName="プロフィール"
				backHref="/home"
				backLabel="戻る"
			/>

			{/* コンテンツ */}
			<div
				className="wafuu-content"
				style={{ justifyContent: "flex-start", paddingTop: "80px" }}
			>
				<div
					className="wafuu-flex-col wafuu-gap-16"
					style={{ width: "100%", maxWidth: "500px", alignItems: "center" }}
				>
					{/* ローディング */}
					{loading && (
						<div
							className="wafuu-text-center wafuu-pulse"
							style={{ color: "#f5e6c8", marginTop: "2rem" }}
						>
							読み込み中...
						</div>
					)}

					{/* エラー */}
					{error && (
						<div className="wafuu-error" style={{ width: "100%" }}>
							{error}
						</div>
					)}

					{/* プロフィールコンテンツ */}
					{profile && (
						<>
							{/* ---- アバター & 名前セクション ---- */}
							<div
								className="wafuu-fade-up wafuu-fade-up-1"
								style={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									gap: "12px",
								}}
							>
								<img
									src={profile.image || "/images/default-avatar.png"}
									alt="アバター"
									className="wafuu-profile-avatar"
								/>
								<div className="wafuu-profile-name">
									{profile.name || "名無し"}
								</div>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										fontSize: "0.85rem",
										color: online
											? "rgba(74, 222, 128, 0.9)"
											: "rgba(245, 230, 200, 0.4)",
									}}
								>
									<span
										className={`wafuu-status-dot ${
											online
												? "wafuu-status-dot-online"
												: "wafuu-status-dot-offline"
										}`}
									/>
									{online ? "オンライン" : "オフライン"}
								</div>
							</div>

							<div className="wafuu-divider" />

							{/* ---- 対戦成績カード ---- */}
							<div
								className="wafuu-card wafuu-fade-up wafuu-fade-up-2"
								style={{ maxWidth: "100%" }}
							>
								<div className="wafuu-section-title">
									<span>📊</span> 対戦成績
								</div>

								{/* 勝数・敗数・勝率 の 3カラム統計 */}
								<div className="wafuu-stat-grid wafuu-stat-grid-3">
									<div className="wafuu-stat-item">
										<span className="wafuu-stat-value" style={{ color: "#4ade80" }}>
											{profile.wins}
										</span>
										<span className="wafuu-stat-label">勝利</span>
									</div>
									<div className="wafuu-stat-item">
										<span className="wafuu-stat-value" style={{ color: "#f87171" }}>
											{profile.losses}
										</span>
										<span className="wafuu-stat-label">敗北</span>
									</div>
									<div className="wafuu-stat-item">
										<span className="wafuu-stat-value">
											{winRate}
											<span style={{ fontSize: "0.8rem", opacity: 0.6 }}>%</span>
										</span>
										<span className="wafuu-stat-label">勝率</span>
									</div>
								</div>



								<div
									className="wafuu-info-row"
									style={{ marginTop: "12px" }}
								>
									<span className="wafuu-info-label">総対戦数</span>
									<span className="wafuu-info-value">
										{profile.totalMatches} 戦
									</span>
								</div>
							</div>

							{/* ---- アカウント情報カード ---- */}
							<div
								className="wafuu-card wafuu-fade-up wafuu-fade-up-3"
								style={{ maxWidth: "100%" }}
							>
								<div className="wafuu-section-title">
									<span>📋</span> アカウント情報
								</div>

								<div className="wafuu-info-row">
									<span className="wafuu-info-label">メールアドレス</span>
									<span className="wafuu-info-value">
										{profile.email || "未設定"}
									</span>
								</div>
								<div className="wafuu-info-row">
									<span className="wafuu-info-label">登録日</span>
									<span className="wafuu-info-value">
										{formatDate(profile.createdAt)}
									</span>
								</div>
							</div>

							{/* ---- 編集ボタン ---- */}
							<div
								className="wafuu-fade-up wafuu-fade-up-4"
								style={{ width: "100%" }}
							>
								<Link href="/profile/edit" className="wafuu-btn-primary" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
									✏️ プロフィールを編集
								</Link>
							</div>

							{/* ---- ホームに戻る ---- */}
							<div className="wafuu-mt-16" style={{ width: "100%" }}>
								<Link href="/home" className="wafuu-btn-outline">
									ホームに戻る
								</Link>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
