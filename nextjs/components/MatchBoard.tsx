"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Socket } from "socket.io-client";

// 5×5 将棋の型
type PieceData = {
	kanji: string;
	side: "sente" | "gote";
} | null;

const INITIAL_BOARD: PieceData[][] = [
	// Row 0 (後手の最奥)
	[
		{ kanji: "王", side: "gote" },
		{ kanji: "金", side: "gote" },
		{ kanji: "銀", side: "gote" },
		{ kanji: "角", side: "gote" },
		{ kanji: "飛", side: "gote" },
	],
	// Row 1 (後手の歩 — 王の前)
	[
		null,
		null,
		null,
		null,
		{ kanji: "歩", side: "gote" },
	],
	// Row 2 (中央)
	[null, null, null, null, null],
	// Row 3 (先手の歩 — 王の前)
	[
		{ kanji: "歩", side: "sente" },
		null,
		null,
		null,
		null,
	],
	// Row 4 (先手の最奥)
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

	// 相手の手を受信
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
			if (roomId && wsStatus !== "connected") return;
			if (roomId && !isMyTurn) return;

			const cell = board[row][col];

			if (selected) {
				const selectedPiece = board[selected.row][selected.col];

				// 自分の駒をクリック → 選択変更
				if (cell && cell.side === mySide) {
					setSelected({ row, col });
					return;
				}

				// 自分の駒がある場所には移動不可
				if (cell && selectedPiece && cell.side === selectedPiece.side) {
					setSelected({ row, col });
					return;
				}

				// 移動実行
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

					// WebSocket で移動を送信
					if (socket && roomId) {
						socket.emit("move", { roomId, from, to });
					}
				}

				setSelected(null);
			} else {
				// 自分の駒を選択
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
					{roomId && (
						<span
							style={{
								fontSize: "0.8rem",
								color: isMyTurn ? "#4ade80" : "rgba(245, 230, 200, 0.4)",
							}}
						>
							{isMyTurn ? "（あなたの番です）" : "（相手の番です）"}
						</span>
					)}
				</div>

				{/* 後手プレイヤー情報 */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						marginBottom: "8px",
						color: "rgba(245, 230, 200, 0.6)",
						fontSize: "0.85rem",
					}}
				>
					<span
						style={{
							padding: "2px 10px",
							borderRadius: "6px",
							background: "rgba(100, 149, 237, 0.15)",
							color: "#6495ed",
							fontSize: "0.75rem",
							fontWeight: 600,
						}}
					>
						後手
					</span>
					<span>{mySide === "gote" ? "あなた" : "対戦相手"}</span>
				</div>

				{/* 5×5 盤面 */}
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(5, 1fr)",
						gap: "2px",
						width: "min(340px, 85vw)",
						aspectRatio: "1",
						background: "rgba(139, 90, 43, 0.3)",
						border: "3px solid rgba(212, 175, 55, 0.4)",
						borderRadius: "4px",
						padding: "3px",
						boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
					}}
				>
					{board.flatMap((row, rowIdx) =>
						row.map((cell, colIdx) => {
							const isSelected =
								selected?.row === rowIdx && selected?.col === colIdx;
							return (
								<div
									key={`${rowIdx}-${colIdx}`}
									onClick={() => handleCellClick(rowIdx, colIdx)}
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										background: isSelected
											? "rgba(212, 175, 55, 0.3)"
											: "rgba(222, 184, 135, 0.15)",
										border: isSelected
											? "2px solid rgba(212, 175, 55, 0.7)"
											: "1px solid rgba(212, 175, 55, 0.1)",
										borderRadius: "2px",
										cursor: "pointer",
										transition: "all 0.2s ease",
										aspectRatio: "1",
									}}
								>
									{cell && (
										<div
											style={{
												fontSize: "clamp(1.2rem, 4vw, 1.8rem)",
												fontWeight: 700,
												color:
													cell.side === "sente"
														? "#f5e6c8"
														: "#6495ed",
												textShadow:
													cell.side === "sente"
														? "0 0 8px rgba(212, 175, 55, 0.4)"
														: "0 0 8px rgba(100, 149, 237, 0.4)",
												transform:
													cell.side === "gote"
														? "rotate(180deg)"
														: "none",
											}}
										>
											{cell.kanji}
										</div>
									)}
								</div>
							);
						})
					)}
				</div>

				{/* 先手プレイヤー情報 */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						marginTop: "8px",
						color: "rgba(245, 230, 200, 0.6)",
						fontSize: "0.85rem",
					}}
				>
					<span
						style={{
							padding: "2px 10px",
							borderRadius: "6px",
							background: "rgba(212, 175, 55, 0.15)",
							color: "#d4af37",
							fontSize: "0.75rem",
							fontWeight: 600,
						}}
					>
						先手
					</span>
					<span>{mySide === "sente" ? "あなた" : "対戦相手"}</span>
				</div>

				{/* 投了ボタン */}
				<button
					onClick={handleEndMatch}
					style={{
						marginTop: "24px",
						padding: "10px 24px",
						border: "1px solid rgba(200, 50, 50, 0.3)",
						borderRadius: "10px",
						background: "rgba(200, 50, 50, 0.1)",
						color: "#ff8888",
						fontSize: "0.9rem",
						cursor: "pointer",
						transition: "all 0.3s ease",
					}}
				>
					🏳️ 投了する
				</button>
			</div>
		</div>
	);
}

export default MatchBoard;
export { MatchBoard };
export type { PieceData };
