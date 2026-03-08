"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Socket } from "socket.io-client";
import { useShogiGame } from "@/hooks/useShogiGame";
import { PieceData, DEMOTE_MAP,} from "@/utils/shogiConstants";

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
	mySide?: "sente" | "gote";
}

function MatchBoard({ roomId, socket, wsStatus = "disconnected", mySide = "sente" }: MatchBoardProps) {
	const {
        board,
        turn,
        senteHand,
        goteHand,
        selected,               // 追加：選択中の駒
        selectedHandPiece,      // 追加：選択中の持ち駒
        isMyTurn,               // 追加
        isLegalTarget,          // 追加：移動先ハイライト用
        isLegalDropTarget,      // 追加：打ち先ハイライト用
        promoteDialog,
        setPromoteDialog,       // 追加：ダイアログを閉じる用
        executeMove,            // 追加：成る・成らないの実行用
        handleCellClick,
        handleHandPieceClick,
        handleEndMatch
    } = useShogiGame(socket, roomId, mySide, wsStatus);

	// WS status label
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
		<div>
			<header className="header">
				<Link
					href="/home"
					className="header-logo"
					style={{ textDecoration: "none" }}
				>
					🐯 虎戦
				</Link>
				<div className="header-user">
					{roomId && (
						<span className="text-muted text-sm">ルーム: {roomId}</span>
					)}
					{roomId && <span className={statusClass}>{statusLabel}</span>}
				</div>
			</header>

			<div className="page page-top">
				<div className="board-container">
					{/* Turn indicator */}
					<div className="turn-indicator">
						<span className={`turn-badge ${turn === "sente" ? "turn-sente" : "turn-gote"}`}>
							{turn === "sente" ? "▲ 先手の番" : "△ 後手の番"}
						</span>
						{roomId && (
							<span className="turn-you">
								{isMyTurn ? "（あなたの番です）" : "（相手の番です）"}
							</span>
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
								const legalTarget = isLegalTarget(rowIdx, colIdx);
								const legalDrop = isLegalDropTarget(rowIdx, colIdx);
								const isHighlighted = legalTarget || legalDrop;
								const isCapture = isHighlighted && cell !== null;
								const cellClass = `board-cell${isSelected ? " board-cell-selected" : ""}${isHighlighted ? " board-cell-legal" : ""}${isCapture ? " board-cell-capture" : ""}`;
								const promoted = cell ? !!DEMOTE_MAP[cell.kanji] : false;
								return (
									<div
										key={`${rowIdx}-${colIdx}`}
										className={cellClass}
										onClick={() => handleCellClick(rowIdx, colIdx)}
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
						対局を終える
					</button>
				</div>
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
