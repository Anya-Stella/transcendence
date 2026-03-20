import { useMemo, useCallback } from "react";
import {
	getLegalMovesForPiece,
	getLegalDrops,
	type LegalTarget,
	type PieceInfo,
	PieceData, 
	HandPieces,
	Pos } from "@torassen/shogi-logic";

export function useLegalMoves(
	board: PieceData[][],
	turn: "sente" | "gote",
	senteHand: HandPieces,
	goteHand: HandPieces,
	selected: Pos | null,
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
		(pos:Pos) => {
			return legalTargets.some((t) => t.row === pos.row && t.col === pos.col);
		},
		[legalTargets]
	);

	const isLegalDropTarget = useCallback(
		(pos:Pos) => {
			return legalDropTargets.some((t) => t.row === pos.row && t.col === pos.col);
		},
		[legalDropTargets]
	);

	const getLegalTargetInfo = useCallback(
		(pos:Pos): LegalTarget | undefined => {
			return legalTargets.find((t) => t.row === pos.row && t.col === pos.col);
		},
		[legalTargets]
	);

	return {
		isLegalTarget,
		isLegalDropTarget,
		getLegalTargetInfo,
	};
}
