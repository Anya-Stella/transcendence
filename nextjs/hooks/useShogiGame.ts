import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Socket } from "socket.io-client";
import {
	PieceData,
	INITIAL_BOARD,
	HandPieces,
} from "@/utils/shogiConstants";
import {
	getLegalMovesForPiece,
	getLegalDrops,
	type LegalTarget,
	type PieceInfo,
} from "@/lib/shogi/board";
import { useBoard } from "./useBoard";
import { useHands } from "./useHands";

export function useShogiGame(
	socket: Socket | null | undefined,
	roomId: string | undefined,
	mySide: "sente" | "gote",
	wsStatus: "connected" | "disconnected" | "connecting"
) {
	const router = useRouter();

	// 子フック
	const { board, movePiece, dropPiece } = useBoard(INITIAL_BOARD);
	const { senteHand, goteHand, addCapturedPiece, removeHandPiece } = useHands();

	// UI状態
	const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
	const [selectedHandPiece, setSelectedHandPiece] = useState<string | null>(null);
	const [turn, setTurn] = useState<"sente" | "gote">("sente");
	const [promoteDialog, setPromoteDialog] = useState<{
		from: { row: number; col: number };
		to: { row: number; col: number };
	} | null>(null);

	const isMyTurn = turn === mySide;

	// ========= 合法手計算 =========

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

	// ========= アクション =========

	// ローカルのみ適用（WebSocket送信なし）
	const applyMove = useCallback(
		(from: { row: number; col: number }, to: { row: number; col: number }, promote: boolean) => {
			const { capturedKanji, capturingSide } = movePiece(from, to, promote);

			if (capturedKanji && capturingSide) {
				addCapturedPiece(capturedKanji, capturingSide);
			}

			setTurn((prev) => (prev === "sente" ? "gote" : "sente"));
			setSelected(null);
			setPromoteDialog(null);
		},
		[movePiece, addCapturedPiece]
	);

	const applyDrop = useCallback(
		(kanji: string, to: { row: number; col: number }, side: "sente" | "gote") => {
			dropPiece(kanji, to, side);
			removeHandPiece(kanji, side);

			setTurn((prev) => (prev === "sente" ? "gote" : "sente"));
			setSelectedHandPiece(null);
			setSelected(null);
		},
		[dropPiece, removeHandPiece]
	);

	// ローカル適用 ＋ WebSocket送信
	const executeMove = useCallback(
		(from: { row: number; col: number }, to: { row: number; col: number }, promote: boolean) => {
			applyMove(from, to, promote);

			if (socket && roomId) {
				socket.emit("move", { roomId, from, to, promote });
			}
		},
		[applyMove, socket, roomId]
	);

	const executeDrop = useCallback(
		(kanji: string, to: { row: number; col: number }) => {
			const side = turn;
			applyDrop(kanji, to, side);

			if (socket && roomId) {
				socket.emit("move", { roomId, drop: kanji, to });
			}
		},
		[turn, applyDrop, socket, roomId]
	);

	// ========= 相手の手を受信（WebSocket送信しない） =========

	useEffect(() => {
		if (!socket) return;

		const handleMoveMade = (data: {
			from?: { row: number; col: number };
			to: { row: number; col: number };
			promote?: boolean;
			drop?: string;
		}) => {
			if (data.drop) {
				// 相手の手番を推定（自分の逆）
				const oppSide = mySide === "sente" ? "gote" : "sente";
				applyDrop(data.drop, data.to, oppSide);
			} else if (data.from) {
				applyMove(data.from, data.to, data.promote ?? false);
			}
		};

		socket.on("moveMade", handleMoveMade);
		return () => {
			socket.off("moveMade", handleMoveMade);
		};
	}, [socket, applyMove, applyDrop, mySide]);

	// ========= クリックハンドラ =========

	const handleCellClick = useCallback(
		(row: number, col: number) => {
			if (roomId && wsStatus !== "connected") return;
			if (roomId && !isMyTurn) return;
			if (promoteDialog) return;

			const cell = board[row][col];

			// 持ち駒選択中 → 打ち / 解除
			if (selectedHandPiece) {
				if (isLegalDropTarget(row, col)) {
					executeDrop(selectedHandPiece, { row, col });
				} else if (cell && cell.side === mySide) {
					setSelectedHandPiece(null);
					setSelected({ row, col });
				} else {
					setSelectedHandPiece(null);
				}
				return;
			}

			// 盤上の駒選択中
			if (selected) {
				// 自駒クリック → 選び直し
				if (cell && cell.side === mySide) {
					setSelected({ row, col });
					return;
				}

				// 合法手チェック
				const targetInfo = getLegalTargetInfo(row, col);
				if (targetInfo) {
					const from = { row: selected.row, col: selected.col };
					const to = { row, col };

					if (targetInfo.canPromote) {
						setPromoteDialog({ from, to });
					} else if (targetInfo.mustPromote) {
						executeMove(from, to, true);
					} else {
						executeMove(from, to, targetInfo.promote);
					}
				} else {
					setSelected(null);
				}
			} else {
				// 自分の手番の駒を選択
				if (cell && cell.side === turn) {
					setSelected({ row, col });
					setSelectedHandPiece(null);
				}
			}
		},
		[
			board, selected, selectedHandPiece, mySide, turn, isMyTurn,
			roomId, wsStatus, promoteDialog,
			isLegalDropTarget, getLegalTargetInfo, executeMove, executeDrop,
		]
	);

	const handleHandPieceClick = useCallback(
		(kanji: string) => {
			if (roomId && wsStatus !== "connected") return;
			if (roomId && !isMyTurn) return;
			if (promoteDialog) return;
			if (turn !== mySide) return;

			setSelected(null);
			setSelectedHandPiece((prev) => (prev === kanji ? null : kanji));
		},
		[roomId, wsStatus, isMyTurn, promoteDialog, turn, mySide]
	);

	const handleEndMatch = useCallback(() => {
		router.push("/result" + (roomId ? `?roomId=${roomId}` : ""));
	}, [router, roomId]);

	// ========= 返り値 =========

	return {
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
	};
}