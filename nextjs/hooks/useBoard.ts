import { useState, useCallback } from "react";
import {
	PieceData,
	PROMOTE_MAP,
	DEMOTE_MAP,
} from "@/utils/shogiConstants";

function deepCopyBoard(board: PieceData[][]): PieceData[][] {
	return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function useBoard(initialBoard: PieceData[][]) {
	const [board, setBoard] = useState<PieceData[][]>(deepCopyBoard(initialBoard));

	/**
	 * 盤上の駒を移動する。取った駒の漢字を返す（なければnull）。
	 */
	const movePiece = useCallback(
		(
			from: { row: number; col: number },
			to: { row: number; col: number },
			promote: boolean
		): { capturedKanji: string | null; capturingSide: "sente" | "gote" | null } => {
			let capturedKanji: string | null = null;
			let capturingSide: "sente" | "gote" | null = null;

			setBoard((prev) => {
				const next = deepCopyBoard(prev);
				const piece = next[from.row][from.col];
				if (!piece) return prev;

				// 駒取り判定
				const captured = next[to.row][to.col];
				if (captured && captured.side !== piece.side) {
					// 成駒は元に戻す
					let kanji = captured.kanji;
					if (DEMOTE_MAP[kanji]) {
						kanji = DEMOTE_MAP[kanji];
					}
					if (kanji !== "王" && kanji !== "玉") {
						capturedKanji = kanji;
						capturingSide = piece.side;
					}
				}

				// 駒移動
				next[to.row][to.col] = { ...piece };
				next[from.row][from.col] = null;

				// 成り処理
				if (promote && PROMOTE_MAP[piece.kanji]) {
					next[to.row][to.col] = {
						kanji: PROMOTE_MAP[piece.kanji],
						side: piece.side,
					};
				}

				return next;
			});

			return { capturedKanji, capturingSide };
		},
		[]
	);

	/**
	 * 持ち駒を盤上に打つ。
	 */
	const dropPiece = useCallback(
		(kanji: string, to: { row: number; col: number }, side: "sente" | "gote") => {
			setBoard((prev) => {
				const next = deepCopyBoard(prev);
				next[to.row][to.col] = { kanji, side };
				return next;
			});
		},
		[]
	);

	return { board, movePiece, dropPiece };
}