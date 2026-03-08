"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Socket } from "socket.io-client";
import {
	getLegalMovesForPiece,
	getLegalDrops,
	type LegalTarget,
	type PieceInfo,
	KANJI_TO_PTYPE,
	PTYPE_TO_KANJI_SENTE,
} from "@/lib/shogi/board";
import { PType } from "@/lib/shogi/types";

// 5×5 Shogi types
type PieceData = {
	kanji: string;
	side: "sente" | "gote";
} | null;

// 成駒の漢字マッピング
const PROMOTE_MAP: Record<string, string> = {
	"歩": "と",
	"銀": "全",
	"角": "馬",
	"飛": "龍",
};

// 成駒 → 元の駒
const DEMOTE_MAP: Record<string, string> = {
	"と": "歩",
	"全": "銀",
	"馬": "角",
	"龍": "飛",
	"竜": "飛",
};

const INITIAL_BOARD: PieceData[][] = [
	// Row 0 (Gote's back rank)
	[
		{ kanji: "王", side: "gote" },
		{ kanji: "金", side: "gote" },
		{ kanji: "銀", side: "gote" },
		{ kanji: "角", side: "gote" },
		{ kanji: "飛", side: "gote" },
	],
	// Row 1 (Gote's pawn)
	[
		null,
		null,
		null,
		null,
		{ kanji: "歩", side: "gote" },
	],
	// Row 2 (empty)
	[null, null, null, null, null],
	// Row 3 (Sente's pawn)
	[
		{ kanji: "歩", side: "sente" },
		null,
		null,
		null,
		null,
	],
	// Row 4 (Sente's back rank)
	[
		{ kanji: "飛", side: "sente" },
		{ kanji: "角", side: "sente" },
		{ kanji: "銀", side: "sente" },
		{ kanji: "金", side: "sente" },
		{ kanji: "王", side: "sente" },
	],
];

type HandPieces = Record<string, number>;

const INITIAL_HAND: HandPieces = {};

function deepCopyBoard(board: PieceData[][]): PieceData[][] {
	return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

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
	const router = useRouter();
	const [board, setBoard] = useState<PieceData[][]>(deepCopyBoard(INITIAL_BOARD));
	const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
	const [selectedHandPiece, setSelectedHandPiece] = useState<string | null>(null);
	const [turn, setTurn] = useState<"sente" | "gote">("sente");
	const [senteHand, setSenteHand] = useState<HandPieces>({ ...INITIAL_HAND });
	const [goteHand, setGoteHand] = useState<HandPieces>({ ...INITIAL_HAND });
	const [promoteDialog, setPromoteDialog] = useState<{
		from: { row: number; col: number };
		to: { row: number; col: number };
	} | null>(null);

	const isMyTurn = turn === mySide;
	const myHand = mySide === "sente" ? senteHand : goteHand;
	const oppHand = mySide === "sente" ? goteHand : senteHand;

	// Compute legal targets for selected piece
	const legalTargets: LegalTarget[] = useMemo(() => {
		if (!selected) return [];
		return getLegalMovesForPiece(
			board as (PieceInfo | null)[][],
			turn,
			senteHand,
			goteHand,
			selected.row,
			selected.col
		);
	}, [selected, board, turn, senteHand, goteHand]);

	// Compute legal drop targets for selected hand piece
	const legalDropTargets: { row: number; col: number }[] = useMemo(() => {
		if (!selectedHandPiece) return [];
		return getLegalDrops(
			board as (PieceInfo | null)[][],
			turn,
			senteHand,
			goteHand,
			selectedHandPiece
		);
	}, [selectedHandPiece, board, turn, senteHand, goteHand]);

	// Helper to check if a square is a legal target
	const isLegalTarget = useCallback(
		(row: number, col: number) => {
			return legalTargets.some((t) => t.row === row && t.col === col);
		},
		[legalTargets]
	);

	const isLegalDropTarget = useCallback(
		(row: number, col: number) => {
			return legalDropTargets.some((t) => t.row === row && t.col === col);
		},
		[legalDropTargets]
	);

	const getLegalTargetInfo = useCallback(
		(row: number, col: number): LegalTarget | undefined => {
			return legalTargets.find((t) => t.row === row && t.col === col);
		},
		[legalTargets]
	);

	// Execute a move on the board
	const executeMove = useCallback(
		(from: { row: number; col: number }, to: { row: number; col: number }, promote: boolean) => {
			setBoard((prev) => {
				const next = deepCopyBoard(prev);
				const piece = next[from.row][from.col];
				if (!piece) return prev;

				// Handle capture
				const captured = next[to.row][to.col];
				if (captured && captured.side !== piece.side) {
					// Demote captured piece and add to hand
					let capturedKanji = captured.kanji;
					if (DEMOTE_MAP[capturedKanji]) {
						capturedKanji = DEMOTE_MAP[capturedKanji];
					}
					if (capturedKanji !== "王" && capturedKanji !== "玉") {
						if (piece.side === "sente") {
							setSenteHand((h) => ({ ...h, [capturedKanji]: (h[capturedKanji] || 0) + 1 }));
						} else {
							setGoteHand((h) => ({ ...h, [capturedKanji]: (h[capturedKanji] || 0) + 1 }));
						}
					}
				}

				// Move piece
				next[to.row][to.col] = { ...piece };
				next[from.row][from.col] = null;

				// Handle promotion
				if (promote && PROMOTE_MAP[piece.kanji]) {
					next[to.row][to.col] = { kanji: PROMOTE_MAP[piece.kanji], side: piece.side };
				}

				return next;
			});

			setTurn((prev) => (prev === "sente" ? "gote" : "sente"));
			setSelected(null);
			setPromoteDialog(null);

			// Send move via WebSocket
			if (socket && roomId) {
				socket.emit("move", { roomId, from, to, promote });
			}
		},
		[socket, roomId]
	);

	// Execute a drop
	const executeDrop = useCallback(
		(kanji: string, to: { row: number; col: number }) => {
			const side = turn;

			setBoard((prev) => {
				const next = deepCopyBoard(prev);
				next[to.row][to.col] = { kanji, side };
				return next;
			});

			// Remove from hand
			if (side === "sente") {
				setSenteHand((h) => {
					const next = { ...h };
					next[kanji] = (next[kanji] || 0) - 1;
					if (next[kanji] <= 0) delete next[kanji];
					return next;
				});
			} else {
				setGoteHand((h) => {
					const next = { ...h };
					next[kanji] = (next[kanji] || 0) - 1;
					if (next[kanji] <= 0) delete next[kanji];
					return next;
				});
			}

			setTurn((prev) => (prev === "sente" ? "gote" : "sente"));
			setSelectedHandPiece(null);
			setSelected(null);

			// Send drop via WebSocket
			if (socket && roomId) {
				socket.emit("move", { roomId, drop: kanji, to });
			}
		},
		[turn, socket, roomId]
	);

	// Listen for opponent's moves
	useEffect(() => {
		if (!socket) return;

		const handleMoveMade = (data: {
			from?: { row: number; col: number };
			to: { row: number; col: number };
			promote?: boolean;
			drop?: string;
		}) => {
			if (data.drop) {
				// Opponent dropped a piece
				executeDrop(data.drop, data.to);
			} else if (data.from) {
				executeMove(data.from, data.to, data.promote ?? false);
			}
		};

		socket.on("moveMade", handleMoveMade);

		return () => {
			socket.off("moveMade", handleMoveMade);
		};
	}, [socket, executeMove, executeDrop]);

	const handleCellClick = useCallback(
		(row: number, col: number) => {
			// Only allow moves during online play if connected
			if (roomId && wsStatus !== "connected") return;
			// Only allow moves if it's my turn (in online mode)
			if (roomId && !isMyTurn) return;

			// If promote dialog is open, ignore board clicks
			if (promoteDialog) return;

			const cell = board[row][col];

			// Handle drop from hand
			if (selectedHandPiece) {
				if (isLegalDropTarget(row, col)) {
					executeDrop(selectedHandPiece, { row, col });
				} else if (cell && cell.side === mySide) {
					// Clicked own piece, switch to board selection
					setSelectedHandPiece(null);
					setSelected({ row, col });
				} else {
					setSelectedHandPiece(null);
				}
				return;
			}

			if (selected) {
				const selectedPiece = board[selected.row][selected.col];

				// Clicking on own piece → select new piece
				if (cell && cell.side === mySide) {
					setSelected({ row, col });
					return;
				}

				// Check if clicking on a legal target
				const targetInfo = getLegalTargetInfo(row, col);
				if (targetInfo && selectedPiece) {
					const from = { row: selected.row, col: selected.col };
					const to = { row, col };

					if (targetInfo.canPromote) {
						// Show promotion dialog
						setPromoteDialog({ from, to });
					} else if (targetInfo.mustPromote) {
						// Must promote
						executeMove(from, to, true);
					} else {
						// No promotion
						executeMove(from, to, targetInfo.promote);
					}
				} else {
					// Clicked on non-legal square, deselect
					setSelected(null);
				}
			} else {
				// Select own piece (only if it's the current turn's piece)
				if (cell && cell.side === turn) {
					setSelected({ row, col });
					setSelectedHandPiece(null);
				}
			}
		},
		[
			board, selected, selectedHandPiece, mySide, turn, isMyTurn,
			socket, roomId, wsStatus, promoteDialog,
			isLegalDropTarget, getLegalTargetInfo, executeMove, executeDrop,
		]
	);

	const handleHandPieceClick = useCallback(
		(kanji: string) => {
			if (roomId && wsStatus !== "connected") return;
			if (roomId && !isMyTurn) return;
			if (promoteDialog) return;
			// Only allow selecting hand pieces for the current turn
			if (turn !== mySide) return;

			setSelected(null);
			setSelectedHandPiece((prev) => (prev === kanji ? null : kanji));
		},
		[roomId, wsStatus, isMyTurn, promoteDialog, turn, mySide]
	);

	const handleEndMatch = () => {
		router.push("/result" + (roomId ? `?roomId=${roomId}` : ""));
	};

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
