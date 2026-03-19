"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Socket } from "socket.io-client";
import { useShogiGame } from "@/hooks/useShogiGame";
import { DEMOTE_MAP } from "@/utils/shogiConstants";
import { PieceData, HandPieces, Pos } from "@/lib/shogi/types";
import { Color, PieceType } from "@torassen/shogi-logic";
import TatamiBackground from "@/components/TatamiBackground";

const PIECE_TYPE_TO_KANJI: Record<number, string> = {
	[PieceType.PAWN]: "歩",
	[PieceType.SILVER]: "銀",
	[PieceType.GOLD]: "金",
	[PieceType.BISHOP]: "角",
	[PieceType.ROOK]: "飛",
	[PieceType.KING]: "玉",
};

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
		executeDrop,
		handleCellClick,
		handleHandPieceClick,
		handleEndMatch,
		lastMove,
		isCheck,
		gameOver
	} = useShogiGame(socket, roomId, mySide, wsStatus);

	const [showCheckOverlay, setShowCheckOverlay] = useState(false);

	// 王手が発生したときに一定時間（2秒）だけオーバーレイを表示
	useEffect(() => {
		if (isCheck) {
			setShowCheckOverlay(true);
			const timer = setTimeout(() => setShowCheckOverlay(false), 2000);
			return () => clearTimeout(timer);
		} else {
			setShowCheckOverlay(false);
		}
	}, [isCheck]);

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
			return null;
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
			<TatamiBackground
				playerColor={mySide === "sente" ? Color.BLACK : Color.WHITE}
				externalTurn={turn === "sente" ? Color.BLACK : Color.WHITE}
				lastExternalMove={lastMove || undefined}
				onBoardMove={(move) => {
					if (move.type === "move") {
						executeMove(move.from, move.to, move.promote ?? false);
					} else if (move.type === "drop") {
						const kanji = PIECE_TYPE_TO_KANJI[move.pieceType];
						if (kanji) {
							executeDrop(kanji, move.to);
						}
					}
				}}
			/>

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
				{/* 王手！ オーバーレイ (盤面中央) */}
				{showCheckOverlay && (
					<div
						className="wafuu-pulse"
						style={{
							position: "fixed",
							top: "50%",
							left: "50%",
							transform: "translate(-50%, -50%)",
							zIndex: 100,
							pointerEvents: "none",
							textAlign: "center"
						}}
					>
						<span
							style={{
								fontSize: "8rem",
								fontWeight: 900,
								color: "#000000",
								textShadow: "0 0 15px rgba(255, 255, 255, 0.6), 0 0 30px rgba(255, 255, 255, 0.3)",
								letterSpacing: "0.4em",
								whiteSpace: "nowrap",
								filter: "drop-shadow(0 0 10px rgba(0,0,0,0.8))"
							}}
						>
							王手
						</span>
					</div>
				)}
				{/* 手番表示 (中央上部) */}
				<div
					style={{
						position: "fixed",
						top: "76px",
						left: "50%",
						transform: "translateX(-50%)",
						display: "flex",
						alignItems: "center",
						gap: "14px",
						zIndex: 50,
						pointerEvents: "auto"
					}}
				>
					<span
						style={{
							padding: "10px 28px",
							borderRadius: "30px",
							fontSize: "1.05rem",
							letterSpacing: "0.1em",
							fontWeight: 900,
							background: "rgba(20, 15, 10, 0.8)",
							color: turn === "sente" ? "#f5e6c8" : "#6495ed",
							border: `2px solid ${turn === "sente" ? "rgba(212, 175, 55, 0.8)" : "rgba(100, 149, 237, 0.8)"}`,
							boxShadow: `0 0 15px ${turn === "sente" ? "rgba(212, 175, 55, 0.3)" : "rgba(100, 149, 237, 0.3)"}, inset 0 0 8px rgba(255, 255, 255, 0.05)`,
							backdropFilter: "blur(12px)",
							textShadow: `0 0 10px ${turn === "sente" ? "rgba(212, 175, 55, 0.4)" : "rgba(100, 149, 237, 0.4)"}`
						}}
					>
						{turn === "sente" ? "▲ 先手の番" : "△ 後手の番"}
					</span>
					{isCheck && (
						<span
							style={{
								padding: "6px 16px",
								background: "rgba(0, 0, 0, 0.3)",
								border: "2px solid #000000",
								borderRadius: "20px",
								color: "#000000",
								fontSize: "0.9rem",
								fontWeight: 900,
								animation: "pulse 1.5s infinite",
								boxShadow: "0 0 10px rgba(0, 0, 0, 0.4)",
								textShadow: "0 0 5px rgba(255, 255, 255, 0.2)"
							}}
						>
							王手
						</span>
					)}
					{gameOver && (
						<span className="game-over-label" style={{ fontSize: "1.1rem" }}>🎉 {gameOver}</span>
					)}
				</div>

				{/* Gote player info + hand (右上) */}
				<div
					style={{
						position: "fixed",
						top: "76px",
						right: "24px",
						display: "flex",
						flexDirection: "column",
						alignItems: "flex-end",
						zIndex: 50,
						pointerEvents: "auto",
						gap: "12px"
					}}
				>
					{/* 名前とバッジのカプセル（ゆとり重視） */}
					<div style={{
						display: "flex",
						alignItems: "center",
						gap: "12px",
						background: "rgba(20, 15, 10, 0.7)",
						padding: "8px 16px",
						borderRadius: "24px",
						border: "1px solid rgba(212, 175, 55, 0.25)",
						backdropFilter: "blur(12px)",
						boxShadow: "0 4px 15px rgba(0,0,0,0.4)"
					}}>
						<span style={{ color: "#f5e6c8", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "0.02em" }}>{mySide === "gote" ? "あなた" : "対戦相手"}</span>
						<span className="board-player-badge badge-gote" style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>後手</span>
					</div>
					{/* 持ち駒を名前の下に適度な間隔で配置 */}
					{/* 3D盤面に表示するため、HUDの持ち駒表示は不要 */}
					{/* 
					<div className="hand-area" style={{ justifyContent: "flex-end", gap: "6px" }}>
						{renderHand(goteHand, "gote", mySide === "gote")}
					</div>
					*/}
				</div>

				{/* Sente player info + hand (左下) */}
				<div
					style={{
						position: "fixed",
						bottom: "24px",
						left: "24px",
						display: "flex",
						flexDirection: "column",
						alignItems: "flex-start",
						zIndex: 50,
						pointerEvents: "auto",
						gap: "12px"
					}}
				>
					{/* 名前とバッジのカプセル（ゆとり重視） */}
					<div style={{
						display: "flex",
						alignItems: "center",
						gap: "12px",
						background: "rgba(20, 15, 10, 0.7)",
						padding: "8px 16px",
						borderRadius: "24px",
						border: "1px solid rgba(212, 175, 55, 0.25)",
						backdropFilter: "blur(12px)",
						boxShadow: "0 4px 15px rgba(0,0,0,0.4)"
					}}>
						<span className="board-player-badge badge-sente" style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>先手</span>
						<span style={{ color: "#f5e6c8", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "0.02em" }}>{mySide === "sente" ? "あなた" : "対戦相手"}</span>
					</div>
					{/* 持ち駒を名前の下に適度な間隔で配置 */}
					{/* 3D盤面に表示するため、HUDの持ち駒表示は不要 */}
					{/* 
					<div className="hand-area" style={{ justifyContent: "flex-start", gap: "6px" }}>
						{renderHand(senteHand, "sente", mySide === "sente")}
					</div>
					*/}
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
					投了する
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