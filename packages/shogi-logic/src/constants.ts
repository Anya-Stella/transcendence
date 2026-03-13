// ============================================================
// @torassen/shogi-logic — 5×5 Mini Shogi constants
// ============================================================

import { Color, PieceType, PromotedPieceType, type Piece, type BoardState, type Hand } from "./types";

/** 盤面サイズ */
export const BOARD_SIZE = 5;

/** 初期局面の SFEN 文字列 (5×5 将棋) */
export const INITIAL_SFEN = "rbsgk/4p/5/P4/KGSBR b - 1";

/** 成れる駒の対応表 */
export const PROMOTION_MAP: Partial<Record<number, number>> = {
	[PieceType.PAWN]: PromotedPieceType.PRO_PAWN,
	[PieceType.SILVER]: PromotedPieceType.PRO_SILVER,
	[PieceType.BISHOP]: PromotedPieceType.PRO_BISHOP,
	[PieceType.ROOK]: PromotedPieceType.PRO_ROOK,
};

/** 成り駒から元の駒種への逆引き */
export const UNPROMOTE_MAP: Partial<Record<number, PieceType>> = {
	[PromotedPieceType.PRO_PAWN]: PieceType.PAWN,
	[PromotedPieceType.PRO_SILVER]: PieceType.SILVER,
	[PromotedPieceType.PRO_BISHOP]: PieceType.BISHOP,
	[PromotedPieceType.PRO_ROOK]: PieceType.ROOK,
};

/** 駒の表示名 (先手) */
export const PIECE_DISPLAY_NAMES: Record<number, string> = {
	[PieceType.PAWN]: "歩",
	[PieceType.SILVER]: "銀",
	[PieceType.GOLD]: "金",
	[PieceType.BISHOP]: "角",
	[PieceType.ROOK]: "飛",
	[PieceType.KING]: "玉",
	[PromotedPieceType.PRO_PAWN]: "と",
	[PromotedPieceType.PRO_SILVER]: "全",
	[PromotedPieceType.PRO_BISHOP]: "馬",
	[PromotedPieceType.PRO_ROOK]: "龍",
};

/** SFEN 用の駒文字 */
export const PIECE_TO_SFEN: Record<number, string> = {
	[PieceType.PAWN]: "P",
	[PieceType.SILVER]: "S",
	[PieceType.GOLD]: "G",
	[PieceType.BISHOP]: "B",
	[PieceType.ROOK]: "R",
	[PieceType.KING]: "K",
	[PromotedPieceType.PRO_PAWN]: "+P",
	[PromotedPieceType.PRO_SILVER]: "+S",
	[PromotedPieceType.PRO_BISHOP]: "+B",
	[PromotedPieceType.PRO_ROOK]: "+R",
};

/** 空の持ち駒 */
export function emptyHand(): Hand {
	return {
		[PieceType.PAWN]: 0,
		[PieceType.SILVER]: 0,
		[PieceType.GOLD]: 0,
		[PieceType.BISHOP]: 0,
		[PieceType.ROOK]: 0,
	};
}

/** 初期盤面を生成 */
export function createInitialBoard(): BoardState {
	const board: (Piece | null)[][] = Array.from({ length: BOARD_SIZE }, () =>
		Array.from({ length: BOARD_SIZE }, () => null),
	);

	// 後手 (WHITE) — 上段 row=0
	// rbsgk → col 0..4
	board[0][0] = { color: Color.WHITE, pieceType: PieceType.ROOK };
	board[0][1] = { color: Color.WHITE, pieceType: PieceType.BISHOP };
	board[0][2] = { color: Color.WHITE, pieceType: PieceType.SILVER };
	board[0][3] = { color: Color.WHITE, pieceType: PieceType.GOLD };
	board[0][4] = { color: Color.WHITE, pieceType: PieceType.KING };

	// 後手の歩 row=1, col=4
	board[1][4] = { color: Color.WHITE, pieceType: PieceType.PAWN };

	// 先手の歩 row=3, col=0
	board[3][0] = { color: Color.BLACK, pieceType: PieceType.PAWN };

	// 先手 (BLACK) — 下段 row=4
	// KGSBR → col 0..4
	board[4][0] = { color: Color.BLACK, pieceType: PieceType.KING };
	board[4][1] = { color: Color.BLACK, pieceType: PieceType.GOLD };
	board[4][2] = { color: Color.BLACK, pieceType: PieceType.SILVER };
	board[4][3] = { color: Color.BLACK, pieceType: PieceType.BISHOP };
	board[4][4] = { color: Color.BLACK, pieceType: PieceType.ROOK };

	return {
		board,
		hands: [emptyHand(), emptyHand()],
		sideToMove: Color.BLACK,
		moveCount: 1,
	};
}
