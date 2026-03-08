import { useState, useCallback } from "react";
import {
	PieceData,
	INITIAL_BOARD,
	HandPieces,
} from "@/utils/shogiConstants";
import { useBoard } from "./useBoard";
import { useHands } from "./useHands";
import { useLegalMoves } from "./useLegalMoves";

export function useGameLogic(mySide: "sente" | "gote") {
	const { board, movePiece, dropPiece } = useBoard(INITIAL_BOARD);
	const { senteHand, goteHand, addCapturedPiece, removeHandPiece } = useHands();

	const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
	const [selectedHandPiece, setSelectedHandPiece] = useState<string | null>(null);
	const [turn, setTurn] = useState<"sente" | "gote">("sente");
	const [promoteDialog, setPromoteDialog] = useState<{
		from: { row: number; col: number };
		to: { row: number; col: number };
	} | null>(null);

	const isMyTurn = turn === mySide;

	// ========= 合法手計算 =========
	const legalMoves = useLegalMoves(
		board,
		turn,
		senteHand,
		goteHand,
		selected,
		selectedHandPiece
	);

	// ========= ローカルへのアクション適用 =========

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

	return {
		// State
		board,
		senteHand,
		goteHand,
		selected,
		setSelected,
		selectedHandPiece,
		setSelectedHandPiece,
		turn,
		setTurn,
		promoteDialog,
		setPromoteDialog,
		isMyTurn,

		// Actions
		applyMove,
		applyDrop,

		// Legal Moves
		...legalMoves,
	};
}
