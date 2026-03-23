import { useState, useCallback, useRef } from "react";
import {PROMOTE_MAP,DEMOTE_MAP, PieceData} from "@torassen/shogi-logic";

function deepCopyBoard(board: PieceData[][]): PieceData[][] {
	return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function useBoard(initialBoard: PieceData[][]) {
	const [board, setBoard] = useState<PieceData[][]>(deepCopyBoard(initialBoard));
	// 最新の盤面をrefでも保持（同期的な読み取り用）
	const boardRef = useRef(board);
	boardRef.current = board;

	/**
	 * 盤上の駒を移動する。取った駒の情報を返す。
	 * 盤面のcurrent stateを直接読んで判定するので確実。
	 */
	const movePiece = useCallback(
		(
			from: { row: number; col: number },
			to: { row: number; col: number },
			promote: boolean
		): { capturedKanji: string | null; capturingSide: "sente" | "gote" | null } => {
			const current = boardRef.current;
			const piece = current[from.row][from.col];
			if (!piece) return { capturedKanji: null, capturingSide: null };

			// 先に取った駒の情報を取得
			let capturedKanji: string | null = null;
			let capturingSide: "sente" | "gote" | null = null;

			const captured = current[to.row][to.col];
			if (captured && captured.side !== piece.side) {
				let kanji = captured.kanji;
				if (DEMOTE_MAP[kanji]) {
					kanji = DEMOTE_MAP[kanji];
				}
				if (kanji !== "王" && kanji !== "玉") {
					capturedKanji = kanji;
					capturingSide = piece.side;
				}
			}

			// 盤面を更新
			setBoard((prev) => {
				const next = deepCopyBoard(prev);
				const movingPiece = next[from.row][from.col];
				if (!movingPiece) return prev;

				next[to.row][to.col] = { ...movingPiece };
				next[from.row][from.col] = null;

				if (promote && PROMOTE_MAP[movingPiece.kanji]) {
					next[to.row][to.col] = {
						kanji: PROMOTE_MAP[movingPiece.kanji],
						side: movingPiece.side,
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