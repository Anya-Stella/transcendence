import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation"; // router用
import { 
    PieceData, 
    INITIAL_BOARD, 
    INITIAL_HAND, 
    HandPieces, 
    DEMOTE_MAP, 
    PROMOTE_MAP 
} from "@/utils/shogiConstants";
import { getLegalMovesForPiece, getLegalDrops } from "@/lib/shogi/board";
import { KANJI_TO_PTYPE, PTYPE_TO_KANJI_SENTE } from "@/lib/shogi/board";
import { type PieceInfo, type LegalTarget } from "@/lib/shogi/types";

function deepCopyBoard(board: PieceData[][]): PieceData[][] {
    return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function useShogiGame(socket: any, roomId: string | string[],mySide: "sente" | "gote",wsStatus: string) {
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

    return {
        // 状態
        board,
        turn,
        selected,
        selectedHandPiece,
        senteHand,
        goteHand,
        promoteDialog,
        isMyTurn,
        legalTargets,
        legalDropTargets,
        
        // 関数
        handleCellClick,
        handleHandPieceClick,
        handleEndMatch,
        isLegalTarget,     // 👈 これが入っていますか？
        isLegalDropTarget,
        setPromoteDialog, // ダイアログを閉じるために必要
        executeMove       // ダイアログで「成る/成らない」を選んだ時に呼ぶ
    };
}