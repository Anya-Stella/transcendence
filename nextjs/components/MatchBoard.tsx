"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Socket } from "socket.io-client";
import { useShogiGame } from "@/hooks/useShogiGame";
import { DEMOTE_MAP } from "@/utils/shogiConstants";
import { PieceData, HandPieces, Pos } from "@/lib/shogi/types";
import TatamiBackground from "@/components/TatamiBackground";

function PieceComponent({ piece, isPromoted }: { piece: PieceData; isPromoted?: boolean }) {
	// 2Dの駒を非表示にする
	return null;
}

interface MatchBoardProps {
	roomId?: string;
	socket?: Socket | null;
	wsStatus?: "connected" | "disconnected" | "connecting";
	mySide?: "sente" | "gote";
}

function MatchBoard({ roomId, socket, wsStatus = "disconnected", mySide = "sente" }: MatchBoardProps) {
	const router = useRouter();
	const [user, setUser] = useState<{ name: string } | null>(null);

	const {
		board,
		turn,
		senteHand,
		goteHand,
		selected,
		selectedHandPiece,
		isMyTurn,
		isLegalTarget,
		isLegalDropTarget,
		promoteDialog,
		setPromoteDialog,
		executeMove,
		handleCellClick,
		handleHandPieceClick,
		handleEndMatch,
		gameOver
	} = useShogiGame(socket, roomId, mySide, wsStatus);

	// ユーザー情報取得
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

	// WS接続ステータス
	const statusBadgeClass =
		wsStatus === "connected"
			? "wafuu-badge wafuu-badge-success"
			: wsStatus === "connecting"
				? "wafuu-badge wafuu-badge-warning"
				: "wafuu-badge wafuu-badge-info";

	const statusLabel =
		wsStatus === "connected"
			? "✅ 接続中"
			: wsStatus === "connecting"
				? "🔄 接続中..."
				: "❌ 切断";

	const statusClass =
		wsStatus === "connected"
			? "ws-status ws-status-connected"
			: wsStatus === "connecting"
				? "ws-status ws-status-connecting"
				: "ws-status ws-status-disconnected";

	// Hand piece display order
	const handOrder = ["飛", "角", "金", "銀", "歩"];

	const renderHand = (hand: HandPieces, side: "sente" | "gote", isOwn: boolean) => {
		const pieces = handOrder.filter((k) => (hand[k] ?? 0) > 0);
		if (pieces.length === 0) {
			return <span className="hand-empty">なし</span>;
		}
		return pieces.map((kanji) => (
			<button
				key={kanji}
				className={`hand-piece ${side === "sente" ? "hand-piece-sente" : "hand-piece-gote"}${isOwn && selectedHandPiece === kanji ? " hand-piece-selected" : ""
					}`}
				onClick={() => isOwn && handleHandPieceClick(kanji)}
				disabled={!isOwn}
			>
				<span className="hand-piece-kanji">{kanji}</span>
				{(hand[kanji] ?? 0) > 1 && (
					<span className="hand-piece-count">{hand[kanji]}</span>
				)}
			</button>
		));
	};

	return (
		<div className="wafuu-page">
			{/* 背景 */}
			<TatamiBackground />

			{/* ヘッダー */}
			<header className="wafuu-header">
				<Link href="/home" className="wafuu-header-logo">
					将棋ゲーム
				</Link>
				<div className="wafuu-header-right">
					{roomId && (
						<span style={{ color: "rgba(245, 230, 200, 0.4)", fontSize: "0.8rem", marginRight: "8px" }}>
							部屋: {roomId} | {statusLabel}
						</span>
					)}
					{user && (
						<span className="wafuu-header-username">{user.name}</span>
					)}
					<button
						className="wafuu-header-btn"
						onClick={handleLogout}
					>
						退出
					</button>
				</div>
			</header>

			{/* コンテンツ */}
			<div className="wafuu-content" style={{ flex: 1, padding: 0, overflow: "hidden", pointerEvents: "none" }}>
				{/* 手番表示 (中央上部) */}
				<div
					style={{
						position: "fixed",
						top: "60px",
						left: "50%",
						transform: "translateX(-50%)",
						display: "flex",
						alignItems: "center",
						gap: "12px",
						zIndex: 50,
						pointerEvents: "auto"
					}}
				>
					<span
						style={{
							padding: "8px 20px",
							borderRadius: "20px",
							fontSize: "0.9rem",
							fontWeight: 700,
							background: turn === "sente" ? "rgba(212, 175, 55, 0.2)" : "rgba(100, 149, 237, 0.2)",
							color: turn === "sente" ? "#f5e6c8" : "#6495ed",
							border: `1px solid ${turn === "sente" ? "rgba(212, 175, 55, 0.4)" : "rgba(100, 149, 237, 0.4)"}`,
							backdropFilter: "blur(6px)"
						}}
					>
						{turn === "sente" ? "▲ 先手の番" : "△ 後手の番"}
					</span>
					{gameOver && (
						<span className="game-over-label" style={{ fontSize: "1.1rem" }}>🎉 {gameOver}</span>
					)}
				</div>

				{/* Gote player info + hand (右上) */}
				<div
					className="board-player-info"
					style={{
						position: "fixed",
						top: "60px",
						right: "24px",
						flexDirection: "column",
						alignItems: "flex-end",
						background: "rgba(20, 15, 10, 0.5)",
						padding: "16px",
						borderRadius: "12px",
						border: "1px solid rgba(212, 175, 55, 0.2)",
						backdropFilter: "blur(12px)",
						zIndex: 50,
						pointerEvents: "auto",
						gap: "10px"
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
						<span className="board-player-badge badge-gote">後手</span>
						<span style={{ color: "#f5e6c8", fontSize: "0.9rem" }}>{mySide === "gote" ? "あなた" : "対戦相手"}</span>
					</div>
					<div className="hand-area" style={{ justifyContent: "flex-end", width: "100%" }}>
						{renderHand(goteHand, "gote", mySide === "gote")}
					</div>
				</div>

				{/* Sente player info + hand (左下) */}
				<div
					className="board-player-info"
					style={{
						position: "fixed",
						bottom: "24px",
						left: "24px",
						flexDirection: "column",
						alignItems: "flex-start",
						background: "rgba(20, 15, 10, 0.5)",
						padding: "16px",
						borderRadius: "12px",
						border: "1px solid rgba(212, 175, 55, 0.2)",
						backdropFilter: "blur(12px)",
						zIndex: 50,
						pointerEvents: "auto",
						gap: "10px"
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
						<span className="board-player-badge badge-sente">先手</span>
						<span style={{ color: "#f5e6c8", fontSize: "0.9rem" }}>{mySide === "sente" ? "あなた" : "対戦相手"}</span>
					</div>
					<div className="hand-area" style={{ justifyContent: "flex-start", width: "100%" }}>
						{renderHand(senteHand, "sente", mySide === "sente")}
					</div>
				</div>

				{/* 投了ボタン (右下) */}
				<button
					style={{
						position: "fixed",
						bottom: "24px",
						right: "24px",
						padding: "12px 24px",
						fontSize: "0.95rem",
						fontWeight: 700,
						border: "2px solid rgba(220, 60, 60, 0.6)",
						borderRadius: "12px",
						color: "#fff",
						background: "rgba(180, 40, 40, 0.7)",
						backdropFilter: "blur(8px)",
						cursor: "pointer",
						zIndex: 50,
						boxShadow: "0 4px 16px rgba(180, 40, 40, 0.3)",
						transition: "all 0.2s ease",
						pointerEvents: "auto"
					}}
					onClick={handleEndMatch}
				>
					🏳️ 投了する
				</button>
			</div>

			{/* Promotion dialog */}
			{promoteDialog && (
				<div className="promote-overlay" style={{ zIndex: 1000 }} onClick={() => setPromoteDialog(null)}>
					<div className="promote-dialog" onClick={(e) => e.stopPropagation()}>
						<p className="promote-title">成りますか？</p>
						<div className="promote-buttons">
							<button
								className="btn promote-btn promote-btn-yes"
								onClick={() => executeMove(promoteDialog.from, promoteDialog.to, true)}
							>
								成る
							</button>
							<button
								className="btn promote-btn promote-btn-no"
								onClick={() => executeMove(promoteDialog.from, promoteDialog.to, false)}
							>
								不成
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default MatchBoard;
export { MatchBoard };
export type { PieceData };