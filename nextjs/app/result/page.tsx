"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import VictoryAnimation from "@/components/Overlay/VictoryAnimation";
import DefeatAnimation from "@/components/Overlay/DefeatAnimation";

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
	const winParam = searchParams.get("win");
	const reason = searchParams.get("reason") || "対局が終了しました";

	const isWin = winParam === "true";

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
					将棋
				</Link>
			</header>

			{/* コンテンツ */}
			<div className="wafuu-content">
				<div
					className="wafuu-card"
					style={{
						textAlign: "center",
						animation: "fadeIn 0.8s ease-out",
						boxShadow: isWin ? "0 0 40px rgba(212, 175, 55, 0.2)" : "0 0 30px rgba(0,0,0,0.4)"
					}}
				>
					{/* 結果アイコン */}
					<div style={{ fontSize: "5rem", marginBottom: "16px", animation: "resultPop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
						{isWin ? <VictoryAnimation /> : <DefeatAnimation />}
					</div>

					{/* 結果テキスト */}
					<h2
						style={{
							fontSize: "3.5rem",
							fontWeight: 900,
							letterSpacing: "0.3em",
							color: isWin ? "#d4af37" : "#888",
							textShadow: isWin
								? "0 0 30px rgba(212, 175, 55, 0.5)"
								: "0 0 20px rgba(0, 0, 0, 0.5)",
							margin: "0 0 16px",
							marginLeft: "0.3em" // letterSpacing adjustment
						}}
					>
						{isWin ? "勝利" : "敗北"}
					</h2>

					<p
						style={{
							color: "rgba(245, 230, 200, 0.7)",
							fontSize: "1.1rem",
							margin: "0 0 40px",
							fontWeight: 500
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
