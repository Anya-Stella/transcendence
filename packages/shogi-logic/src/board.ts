// ============================================================
// @torassen/shogi-logic — Board utilities
// ============================================================

import {
	Color,
	PieceType,
	PromotedPieceType,
	type AnyPieceType,
	type Piece,
	type BoardState,
	type Square,
	type Move,
} from "./types";
import { BOARD_SIZE, UNPROMOTE_MAP, PROMOTION_MAP, emptyHand } from "./constants";

// ─── Helpers ──────────────────────────────────────────────

/** 盤面の範囲内かチェック */
export function isInBounds(row: number, col: number): boolean {
	return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/** 座標が等しいか */
export function squareEquals(a: Square, b: Square): boolean {
	return a.row === b.row && a.col === b.col;
}

/** 盤面をディープコピー */
export function cloneBoardState(state: BoardState): BoardState {
	return {
		board: state.board.map((row) => row.map((cell) => (cell ? { ...cell } : null))),
		hands: [{ ...state.hands[0] }, { ...state.hands[1] }],
		sideToMove: state.sideToMove,
		moveCount: state.moveCount,
	};
}

/** 相手の色を返す */
export function opponentColor(color: Color): Color {
	return color === Color.BLACK ? Color.WHITE : Color.BLACK;
}

// ─── Move Application ─────────────────────────────────────

/**
 * 指し手を盤面に適用し、新しい BoardState を返す。
 * 元の state は変更しない (immutable)。
 * 合法性チェックは行わない。
 */
export function applyMove(state: BoardState, move: Move): BoardState {
	const next = cloneBoardState(state);

	if (move.type === "drop") {
		// 持ち駒から打つ
		next.hands[next.sideToMove][move.pieceType]--;
		next.board[move.to.row][move.to.col] = {
			color: next.sideToMove,
			pieceType: move.pieceType,
		};
	} else {
		// 盤上移動
		const movingPiece = next.board[move.from.row][move.from.col]!;
		const captured = next.board[move.to.row][move.to.col];

		// 駒を取った場合
		if (captured) {
			const capType = UNPROMOTE_MAP[captured.pieceType] ?? captured.pieceType;
			if (capType !== PieceType.KING) {
				next.hands[next.sideToMove][capType] = (next.hands[next.sideToMove][capType] || 0) + 1;
			}
		}

		// 移動元をクリア
		next.board[move.from.row][move.from.col] = null;

		// 成り判定
		let newPieceType: AnyPieceType = movingPiece.pieceType;
		if (move.promote) {
			const promoted = PROMOTION_MAP[movingPiece.pieceType];
			if (promoted !== undefined) {
				newPieceType = promoted as AnyPieceType;
			}
		}

		// 移動先に駒を置く
		next.board[move.to.row][move.to.col] = {
			color: next.sideToMove,
			pieceType: newPieceType,
		};
	}

	// 手番交代
	next.sideToMove = opponentColor(next.sideToMove);
	next.moveCount++;

	return next;
}

// ─── King Position ────────────────────────────────────────

/** 指定色の玉の位置を返す。見つからなければ null */
export function findKing(state: BoardState, color: Color): Square | null {
	for (let row = 0; row < BOARD_SIZE; row++) {
		for (let col = 0; col < BOARD_SIZE; col++) {
			const piece = state.board[row][col];
			if (piece && piece.color === color && piece.pieceType === PieceType.KING) {
				return { row, col };
			}
		}
	}
	return null;
}
