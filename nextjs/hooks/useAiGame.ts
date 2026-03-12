import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { boardFromPieces, type PieceInfo } from "@/lib/shogi/board";
import { useGameLogic } from "./useGameLogic";

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

	const {
		board, // 盤面
		senteHand, // 先手の持ち駒
		goteHand, // 後手の持ち駒
		selected, // 選択中の駒
		setSelected, // 選択中の駒を設定する
		selectedHandPiece, // 選択中の持ち駒
		setSelectedHandPiece, // 選択中の持ち駒を設定する
		turn, // ターン
		promoteDialog, // 成る・成らないのダイアログ
		setPromoteDialog, // 成る・成らないのダイアログを設定する
		isMyTurn, // 自分のターンかどうか
		applyMove, // 移動を適用する
		applyDrop, // 持ち駒の適用
		isLegalTarget, // 移動先が合法かどうか
		isLegalDropTarget, // 打ち先が合法かどうか
		getLegalTargetInfo, // 移動先が合法かどうか
		gameResult, // 対局結果
		setGameResult, // 対局結果を設定する
	} = useGameLogic(mySide);

	const [aiThinking, setAiThinking] = useState(false);

	const aiSide = mySide === "sente" ? "gote" : "sente";

	// 最新のboard/handをrefで保持（非同期AIコールバック用）
	const boardRef = useRef(board);
	const senteHandRef = useRef(senteHand);
	const goteHandRef = useRef(goteHand);
	const turnRef = useRef(turn);
	boardRef.current = board;
	senteHandRef.current = senteHand;
	goteHandRef.current = goteHand;
	turnRef.current = turn;

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
				setGameResult({
					isOver: true,
					winner: mySide,
					message: "あなたの勝ちです！AIが投了しました。",
				});
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
		if (turn === aiSide && !gameResult.isOver && !aiThinking) {
			const timer = setTimeout(() => {
				requestAiMove();
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [turn, aiSide, gameResult.isOver, aiThinking, requestAiMove]);

	// ========= クリックハンドラ =========

	const handleCellClick = (
		(row: number, col: number) => {
			if (!isMyTurn || aiThinking || gameResult.isOver) return;
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
		}
	);

	const handleHandPieceClick = (kanji: string) => {
    if (!isMyTurn || aiThinking || gameResult.isOver) return;
    if (promoteDialog) return;
    if (turn !== mySide) return;

    setSelected(null);
    setSelectedHandPiece(selectedHandPiece === kanji ? null : kanji);
	};

	const handleEndMatch = () => {
		router.push("/result");
	};

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
		gameOver: gameResult.message,
	};
}
