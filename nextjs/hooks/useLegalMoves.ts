import { useMemo, useCallback } from "react";
import {
	getLegalMovesForPiece,
	getLegalDrops,
	type LegalTarget,
	type PieceInfo,
} from "@/lib/shogi/board";
import { PieceData, HandPieces } from "@/utils/shogiConstants";

export function useLegalMoves(
	board: PieceData[][],
	turn: "sente" | "gote",
	senteHand: HandPieces,
	goteHand: HandPieces,
	selected: { row: number; col: number } | null,
	selectedHandPiece: string | null
) {
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

	return {
		isLegalTarget,
		isLegalDropTarget,
		getLegalTargetInfo,
	};
}
