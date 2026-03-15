import { useState, useCallback } from "react";
import {INITIAL_HAND, DEMOTE_MAP,  HandPieces } from "@torassen/shogi-logic";

export function useHands() {
	const [senteHand, setSenteHand] = useState<HandPieces>({ ...INITIAL_HAND });
	const [goteHand, setGoteHand] = useState<HandPieces>({ ...INITIAL_HAND });

	/**
	 * 取った駒を持ち駒に追加する。成駒は自動で元に戻す。
	 */
	const addCapturedPiece = useCallback(
		(kanji: string, side: "sente" | "gote") => {
			const base = DEMOTE_MAP[kanji] || kanji;
			const setHand = side === "sente" ? setSenteHand : setGoteHand;
			setHand((prev) => ({ ...prev, [base]: (prev[base] || 0) + 1 }));
		},
		[]
	);

	/**
	 * 持ち駒から1枚取り除く（打ったとき）。
	 */
	const removeHandPiece = useCallback(
		(kanji: string, side: "sente" | "gote") => {
			const setHand = side === "sente" ? setSenteHand : setGoteHand;
			setHand((prev) => {
				const next = { ...prev };
				next[kanji] = (next[kanji] || 0) - 1;
				if (next[kanji] <= 0) delete next[kanji];
				return next;
			});
		},
		[]
	);

	return { senteHand, goteHand, addCapturedPiece, removeHandPiece };
}