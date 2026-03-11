"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

export default function SpectateRoomPage() {
	const params = useParams();
	const roomId = params.roomId as string;

	return (
		<div className="wafuu-page">
			{/* 背景 */}
			<div
				className="wafuu-bg"
				style={{ backgroundImage: "url(/images/match-bg.png)" }}
			/>

			{/* ヘッダー */}
			<header className="wafuu-header">
				<Link href="/home" className="wafuu-header-logo">
					将棋ゲーム
				</Link>
				<div className="wafuu-header-right">
					<span className="wafuu-badge wafuu-badge-info">
						観戦中
					</span>
				</div>
			</header>

			{/* コンテンツ */}
			<div className="wafuu-content">
				<div className="wafuu-card" style={{ textAlign: "center" }}>
					<div
						style={{
							fontSize: "2rem",
							fontWeight: 800,
							letterSpacing: "0.2em",
							color: "#d4af37",
							textShadow: "0 0 12px rgba(212, 175, 55, 0.3)",
							margin: "8px 0 16px",
						}}
					>
						{roomId}
					</div>
					<p
						style={{
							color: "rgba(245, 230, 200, 0.5)",
							fontSize: "0.9rem",
							margin: "0 0 24px",
						}}
					>
						観戦機能は現在準備中です。<br />
						今後のアップデートをお楽しみに！
					</p>
					<Link href="/home" className="wafuu-btn-outline">
						← 戻る
					</Link>
				</div>
			</div>
		</div>
	);
}
