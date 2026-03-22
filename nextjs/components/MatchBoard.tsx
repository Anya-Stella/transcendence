"use client";

import Link from "next/link";
import { Socket } from "socket.io-client";
import { useShogiGame } from "@/hooks/useShogiGame";
import { DEMOTE_MAP,PieceData,HandPieces, Pos } from "@torassen/shogi-logic";

function PieceComponent({ piece, isPromoted }: { piece: PieceData; isPromoted?: boolean }) {
	if (!piece) return null;

	return (
		<div className={`piece piece-${piece.side}${isPromoted ? " piece-promoted" : ""}`}>
			<div className="piece-inner">{piece.kanji}</div>
		</div>
	);
}

interface MatchBoardProps {
	roomId?: string;
	socket?: Socket | null;
	wsStatus?: "connected" | "disconnected" | "connecting";
	mySide?: "sente" | "gote" | "spectator";
}

function MatchBoard({ roomId, socket, wsStatus = "disconnected", mySide = "sente" }: MatchBoardProps) {
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
				className={`hand-piece ${side === "sente" ? "hand-piece-sente" : "hand-piece-gote"}${
					isOwn && selectedHandPiece === kanji ? " hand-piece-selected" : ""
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
					{roomId && (
						<span
							style={{
								color: "rgba(245, 230, 200, 0.5)",
								fontSize: "0.8rem",
							}}
						>
							部屋: {roomId}
						</span>
					)}
					{roomId && (
						<span className={statusBadgeClass}>{statusLabel}</span>
					)}
				</div>
			</header>

			{/* コンテンツ */}
			<div className="wafuu-content">
				{/* 手番表示 */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "12px",
						marginBottom: "16px",
					}}
				>
					<span
						style={{
							padding: "6px 16px",
							borderRadius: "20px",
							fontSize: "0.85rem",
							fontWeight: 600,
							background:
								turn === "sente"
									? "rgba(212, 175, 55, 0.2)"
									: "rgba(100, 149, 237, 0.2)",
							color:
								turn === "sente" ? "#d4af37" : "#6495ed",
							border: `1px solid ${turn === "sente"
								? "rgba(212, 175, 55, 0.3)"
								: "rgba(100, 149, 237, 0.3)"
								}`,
						}}
					>
						{turn === "sente" ? "▲ 先手の番" : "△ 後手の番"}
					</span>
					{roomId && !gameOver && (
						<span className="turn-you">
							{mySide === "spectator" ? "観戦中" : (isMyTurn ? "（あなたの番です）" : "（相手の番です）")}
						</span>
					)}
					{gameOver && (
						<span className="game-over-label">🎉 {gameOver}</span>
					)}
				</div>

				{/* Gote player info + hand */}
				<div className="board-player-info">
					<span className="board-player-badge badge-gote">後手</span>
					<span>{mySide === "gote" ? "あなた" : "対戦相手"}</span>
					<div className="hand-area">
						{renderHand(goteHand, "gote", mySide === "gote")}
					</div>
				</div>

				{/* 5×5 Board */}
				<div className="board">
					{board.flatMap((row, rowIdx) =>
						row.map((cell, colIdx) => {
							const isSelected =
								selected?.row === rowIdx && selected?.col === colIdx;
							const legalTarget = isLegalTarget({row: rowIdx,col: colIdx});
							const legalDrop = isLegalDropTarget({row: rowIdx,col: colIdx});
							const isHighlighted = legalTarget || legalDrop;
							const isCapture = isHighlighted && cell !== null;
							const cellClass = `board-cell${isSelected ? " board-cell-selected" : ""}${isHighlighted ? " board-cell-legal" : ""}${isCapture ? " board-cell-capture" : ""}`;
							const promoted = cell ? !!DEMOTE_MAP[cell.kanji] : false;
							return (
								<div
									key={`${rowIdx}-${colIdx}`}
									className={cellClass}
									onClick={() => handleCellClick({row: rowIdx,col: colIdx})}
								>
									{isHighlighted && !cell && (
										<div className="legal-dot" />
									)}
									<PieceComponent piece={cell} isPromoted={promoted} />
								</div>
							);
						})
					)}
				</div>

				{/* Sente player info + hand */}
				<div className="board-player-info">
					<span className="board-player-badge badge-sente">先手</span>
					<span>{mySide === "sente" ? "あなた" : "対戦相手"}</span>
					<div className="hand-area">
						{renderHand(senteHand, "sente", mySide === "sente")}
					</div>
				</div>

				{/* End match button */}
				<button
					className="btn btn-danger btn-lg mt-24"
					onClick={handleEndMatch}
				>
					{mySide === "spectator" ? "退出" : "🏳️ 投了する"}
				</button>
			</div>

			{/* Promotion dialog */}
			{promoteDialog && (
				<div className="promote-overlay" onClick={() => setPromoteDialog(null)}>
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