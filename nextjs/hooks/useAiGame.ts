import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
	PieceData,
	INITIAL_BOARD,
	PROMOTE_MAP,
	DEMOTE_MAP,
	HandPieces,
} from "@/utils/shogiConstants";
import {
	getLegalMovesForPiece,
	getLegalDrops,
	boardFromPieces,
	type LegalTarget,
	type PieceInfo,
} from "@/lib/shogi/board";
import { useBoard } from "./useBoard";
import { useHands } from "./useHands";

// 打ち駒の漢字 → USI駒文字
const DROP_KANJI_TO_USI: Record<string, string> = {
	"歩": "P",
	"銀": "S",
	"金": "G",
	"角": "B",
	"飛": "R",
};

// USI駒文字 → 漢字
const USI_TO_DROP_KANJI: Record<string, string> = {
	P: "歩",
	S: "銀",
	G: "金",
	B: "角",
	R: "飛",
};

export function useAiGame(
	mySide: "sente" | "gote" = "sente",
	aiDepth: number = 4
) {
	const router = useRouter();
	const { board, movePiece, dropPiece } = useBoard(INITIAL_BOARD);
	const { senteHand, goteHand, addCapturedPiece, removeHandPiece } = useHands();

	const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
	const [selectedHandPiece, setSelectedHandPiece] = useState<string | null>(null);
	const [turn, setTurn] = useState<"sente" | "gote">("sente");
	const [promoteDialog, setPromoteDialog] = useState<{
		from: { row: number; col: number };
		to: { row: number; col: number };
	} | null>(null);
	const [aiThinking, setAiThinking] = useState(false);
	const [gameOver, setGameOver] = useState<string | null>(null);

	const isMyTurn = turn === mySide;
	const aiSide = mySide === "sente" ? "gote" : "sente";

	// 最新のboard/handをrefで保持（非同期コールバック用）
	const boardRef = useRef(board);
	const senteHandRef = useRef(senteHand);
	const goteHandRef = useRef(goteHand);
	const turnRef = useRef(turn);
	boardRef.current = board;
	senteHandRef.current = senteHand;
	goteHandRef.current = goteHand;
	turnRef.current = turn;

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
		(row: number, col: number) => legalTargets.some((t) => t.row === row && t.col === col),
		[legalTargets]
	);

	const isLegalDropTarget = useCallback(
		(row: number, col: number) => legalDropTargets.some((t) => t.row === row && t.col === col),
		[legalDropTargets]
	);

	const getLegalTargetInfo = useCallback(
		(row: number, col: number): LegalTarget | undefined =>
			legalTargets.find((t) => t.row === row && t.col === col),
		[legalTargets]
	);

	// ========= ローカル適用 =========

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

	// ========= プレイヤーアクション =========

	const executeMove = useCallback(
		(from: { row: number; col: number }, to: { row: number; col: number }, promote: boolean) => {
			applyMove(from, to, promote);
		},
		[applyMove]
	);

	// ========= AI思考 =========

	const requestAiMove = useCallback(async () => {
		setAiThinking(true);

		try {
			// 現在の盤面からSFENを生成
			const currentBoard = boardFromPieces(
				boardRef.current as (PieceInfo | null)[][],
				turnRef.current,
				senteHandRef.current,
				goteHandRef.current
			);
			const sfen = currentBoard.toSfen();

			const res = await fetch("/api/engine/bestmove", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ sfen, depth: aiDepth }),
			});

			const data = await res.json();

			if (data.resign || !data.parsed) {
				setGameOver("あなたの勝ちです！AIが投了しました。");
				return;
			}

			// AIの手を適用
			const { parsed } = data;
			if (parsed.drop) {
				const kanji = USI_TO_DROP_KANJI[parsed.drop];
				if (kanji) {
					applyDrop(kanji, parsed.to, aiSide);
				}
			} else if (parsed.from) {
				applyMove(parsed.from, parsed.to, parsed.promote ?? false);
			}
		} catch (err) {
			console.error("AI move error:", err);
		} finally {
			setAiThinking(false);
		}
	}, [aiDepth, aiSide, applyMove, applyDrop]);

	// AIの手番になったら自動で思考開始
	useEffect(() => {
		if (turn === aiSide && !gameOver && !aiThinking) {
			// 少し遅延を入れてUIが更新されてから思考開始
			const timer = setTimeout(() => {
				requestAiMove();
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [turn, aiSide, gameOver, aiThinking, requestAiMove]);

	// ========= クリックハンドラ =========

	const handleCellClick = useCallback(
		(row: number, col: number) => {
			if (!isMyTurn || aiThinking || gameOver) return;
			if (promoteDialog) return;

			const cell = board[row][col];

			if (selectedHandPiece) {
				if (isLegalDropTarget(row, col)) {
					applyDrop(selectedHandPiece, { row, col }, mySide);
				} else if (cell && cell.side === mySide) {
					setSelectedHandPiece(null);
					setSelected({ row, col });
				} else {
					setSelectedHandPiece(null);
				}
				return;
			}

			if (selected) {
				if (cell && cell.side === mySide) {
					setSelected({ row, col });
					return;
				}

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
				if (cell && cell.side === turn) {
					setSelected({ row, col });
					setSelectedHandPiece(null);
				}
			}
		},
		[
			board, selected, selectedHandPiece, mySide, turn, isMyTurn,
			aiThinking, gameOver, promoteDialog,
			isLegalDropTarget, getLegalTargetInfo, executeMove, applyDrop,
		]
	);

	const handleHandPieceClick = useCallback(
		(kanji: string) => {
			if (!isMyTurn || aiThinking || gameOver) return;
			if (promoteDialog) return;
			if (turn !== mySide) return;

			setSelected(null);
			setSelectedHandPiece((prev) => (prev === kanji ? null : kanji));
		},
		[isMyTurn, aiThinking, gameOver, promoteDialog, turn, mySide]
	);

	const handleEndMatch = useCallback(() => {
		router.push("/result");
	}, [router]);

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
		aiThinking,
		gameOver,
	};
}
