import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGameLogic } from "./useGameLogic";
import { boardFromPieces, type PieceInfo, USI_TO_DROP_KANJI, Pos, PieceType, type Move } from "@torassen/shogi-logic";

const KANJI_TO_PIECE_TYPE: Record<string, PieceType> = {
	"歩": PieceType.PAWN,
	"銀": PieceType.SILVER,
	"金": PieceType.GOLD,
	"角": PieceType.BISHOP,
	"飛": PieceType.ROOK,
	"玉": PieceType.KING,
};

export function useAiGame(
	mySide: "sente" | "gote" = "sente",
	aiDepth: number = 4
) {
	const router = useRouter();
	const [lastMove, setLastMove] = useState<Move | null>(null);

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
		isCheck, // 王手判定
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

	const executeDrop = useCallback(
		(kanji: string, to: { row: number; col: number }) => {
			applyDrop(kanji, to, turn);
		},
		[applyDrop, turn]
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
					setLastMove({ type: "drop", pieceType: KANJI_TO_PIECE_TYPE[kanji] || PieceType.PAWN, to: parsed.to });
				}
			} else if (parsed.from) {
				applyMove(parsed.from, parsed.to, parsed.promote ?? false);
				setLastMove({ type: "move", from: parsed.from, to: parsed.to, promote: parsed.promote ?? false });
			}
		} catch (err) {
			console.error("AI move error:", err);
		} finally {
			setAiThinking(false);
		}
	}, [aiDepth, aiSide, applyMove, applyDrop, mySide, setGameResult]);

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
		(pos: Pos) => {
			if (!isMyTurn || aiThinking || gameResult.isOver) return;
			if (promoteDialog) return;

			const cell = board[pos.row][pos.col];

			if (selectedHandPiece) {
				if (isLegalDropTarget(pos)) {
					applyDrop(selectedHandPiece, pos, mySide);
				} else if (cell && cell.side === mySide) {
					setSelectedHandPiece(null);
					setSelected(pos);
				} else {
					setSelectedHandPiece(null);
				}
				return;
			}

			if (selected) {
				if (cell && cell.side === mySide) {
					setSelected(pos);
					return;
				}

				const targetInfo = getLegalTargetInfo(pos);
				if (targetInfo) {
					const from = selected;
					const to = pos;

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
					setSelected(pos);
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
		if (gameResult.isOver) {
			const isWin = gameResult.winner === mySide;
			const winParam = isWin ? "true" : "false";
			const reasonPara = encodeURIComponent(gameResult.message || "対局終了");
			router.push(`/result?win=${winParam}&reason=${reasonPara}`);
			return;
		}

		setGameResult({
			isOver: true,
			winner: mySide === "sente" ? "gote" : "sente",
			message: "投了しました"
		});
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
		executeDrop,
		handleCellClick,
		handleHandPieceClick,
		handleEndMatch,
		aiThinking,
		lastMove,
		isCheck,
		gameResult,
		gameOver: gameResult.message,
	};
}
