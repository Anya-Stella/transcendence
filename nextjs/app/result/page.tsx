"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResultPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<ResultContent />
		</Suspense>
	);
}

function ResultContent() {
	const searchParams = useSearchParams();
	const roomId = searchParams.get("roomId");

	// ダミーの結果データ
	const isWin = true;
	const reason = "王を取りました";

	return (
		<div className="wafuu-page">
			{/* 背景 */}
			<div
				className="wafuu-bg"
				style={{ backgroundImage: "url(/images/result-bg.png)" }}
			/>

			{/* ヘッダー */}
			<header className="wafuu-header">
				<Link href="/home" className="wafuu-header-logo">
					将棋ゲーム
				</Link>
			</header>

			{/* コンテンツ */}
			<div className="wafuu-content">
				<div className="wafuu-card" style={{ textAlign: "center" }}>
					{/* 結果アイコン */}
					<div style={{ fontSize: "4rem", marginBottom: "8px" }}>
						{isWin ? "🎉" : "😢"}
					</div>

					{/* 結果テキスト */}
					<h2
						style={{
							fontSize: "2rem",
							fontWeight: 800,
							letterSpacing: "0.15em",
							color: isWin ? "#d4af37" : "#ff6b6b",
							textShadow: isWin
								? "0 0 20px rgba(212, 175, 55, 0.5)"
								: "0 0 20px rgba(255, 107, 107, 0.3)",
							margin: "0 0 8px",
						}}
					>
						{isWin ? "勝利" : "敗北"}
					</h2>

					<p
						style={{
							color: "rgba(245, 230, 200, 0.6)",
							fontSize: "0.9rem",
							margin: "0 0 28px",
						}}
					>
						{reason}
					</p>

					{/* ボタン */}
					<div className="wafuu-flex-col wafuu-gap-12">
						{roomId && (
							<Link
								href={`/room/${roomId}?host=true`}
								className="wafuu-btn-primary"
								style={{
									display: "block",
									textAlign: "center",
									textDecoration: "none",
								}}
							>
								もう一局
							</Link>
						)}
						<Link
							href="/home"
							className="wafuu-btn-outline"
						>
							← 戻る
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
