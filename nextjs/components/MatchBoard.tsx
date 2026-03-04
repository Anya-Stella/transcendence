"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Socket } from "socket.io-client";

// 5×5 Shogi types
type PieceData = {
	kanji: string;
	side: "sente" | "gote";
} | null;

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

function deepCopyBoard(board: PieceData[][]): PieceData[][] {
	return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function PieceComponent({ piece }: { piece: PieceData }) {
	if (!piece) return null;

	return (
		<div className={`piece piece-${piece.side}`}>
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
	const [turn, setTurn] = useState<"sente" | "gote">("sente");

	const isMyTurn = turn === mySide;

	// Listen for opponent's moves
	useEffect(() => {
		if (!socket) return;

		const handleMoveMade = (data: {
			from: { row: number; col: number };
			to: { row: number; col: number };
		}) => {
			setBoard((prev) => {
				const next = deepCopyBoard(prev);
				next[data.to.row][data.to.col] = next[data.from.row][data.from.col];
				next[data.from.row][data.from.col] = null;
				return next;
			});
			setTurn((prev) => (prev === "sente" ? "gote" : "sente"));
		};

		socket.on("moveMade", handleMoveMade);

		return () => {
			socket.off("moveMade", handleMoveMade);
		};
	}, [socket]);

	const handleCellClick = useCallback(
		(row: number, col: number) => {
			// Only allow moves during online play if connected
			if (roomId && wsStatus !== "connected") return;
			// Only allow moves if it's my turn (in online mode)
			if (roomId && !isMyTurn) return;

			const cell = board[row][col];

			if (selected) {
				const selectedPiece = board[selected.row][selected.col];

				// Clicking on own piece again → select new piece
				if (cell && cell.side === mySide) {
					setSelected({ row, col });
					return;
				}

				// Cannot move to a square occupied by own piece
				if (cell && selectedPiece && cell.side === selectedPiece.side) {
					setSelected({ row, col });
					return;
				}

				// Execute move
				if (selectedPiece) {
					const from = { row: selected.row, col: selected.col };
					const to = { row, col };

					setBoard((prev) => {
						const next = deepCopyBoard(prev);
						next[to.row][to.col] = next[from.row][from.col];
						next[from.row][from.col] = null;
						return next;
					});

					setTurn((prev) => (prev === "sente" ? "gote" : "sente"));

					// Send move via WebSocket
					if (socket && roomId) {
						socket.emit("move", { roomId, from, to });
					}
				}

				setSelected(null);
			} else {
				// Select own piece
				if (cell && cell.side === mySide) {
					setSelected({ row, col });
				}
			}
		},
		[board, selected, mySide, isMyTurn, socket, roomId, wsStatus]
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

					{/* Gote player info */}
					<div className="board-player-info">
						<span className="board-player-badge badge-gote">後手</span>
						<span>{mySide === "gote" ? "あなた" : "対戦相手"}</span>
					</div>

					{/* 5×5 Board */}
					<div className="board">
						{board.flatMap((row, rowIdx) =>
							row.map((cell, colIdx) => {
								const isSelected =
									selected?.row === rowIdx && selected?.col === colIdx;
								const cellClass = `board-cell${isSelected ? " board-cell-selected" : ""}`;
								return (
									<div
										key={`${rowIdx}-${colIdx}`}
										className={cellClass}
										onClick={() => handleCellClick(rowIdx, colIdx)}
									>
										<PieceComponent piece={cell} />
									</div>
								);
							})
						)}
					</div>

					{/* Sente player info */}
					<div className="board-player-info">
						<span className="board-player-badge badge-sente">先手</span>
						<span>{mySide === "sente" ? "あなた" : "対戦相手"}</span>
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
		</div>
	);
}

export default MatchBoard;
export { MatchBoard };
export type { PieceData };
