// ============================================================
// @torassen/shogi-logic — 5×5 Mini Shogi (虎戦) shared types
// ============================================================

/** 手番 */
export enum Color {
	BLACK = 0, // 先手 (下手)
	WHITE = 1, // 後手 (上手)
}

/** 駒種 (成りなし) */
export enum PieceType {
	PAWN = 0,   // 歩
	SILVER = 1, // 銀
	GOLD = 2,   // 金
	BISHOP = 3, // 角
	ROOK = 4,   // 飛
	KING = 5,   // 玉
}

/** 駒種 (成り込み) */
export enum PromotedPieceType {
	PRO_PAWN = 6,   // と金
	PRO_SILVER = 7, // 成銀
	PRO_BISHOP = 8, // 馬
	PRO_ROOK = 9,   // 龍
}

/** 全駒種の union */
export type AnyPieceType = PieceType | PromotedPieceType;

/** 盤上の 1 マスに置ける駒情報 */
export interface Piece {
	color: Color;
	pieceType: AnyPieceType;
}

/** 盤面座標 (0-indexed, row=段 col=筋) */
export interface Square {
	row: number; // 0..4
	col: number; // 0..4
}

/** 指し手 — 盤上移動 */
export interface BoardMove {
	type: "move";
	from: Square;
	to: Square;
	promote: boolean;
}

/** 指し手 — 持ち駒を打つ */
export interface DropMove {
	type: "drop";
	pieceType: PieceType; // 打てるのは成りなし駒のみ
	to: Square;
}

/** 指し手の union */
export type Move = BoardMove | DropMove;

/** 持ち駒の数量 (駒種 → 枚数) */
export type Hand = Record<number, number>;

/** 盤面全体の状態 */
export interface BoardState {
	/** 5×5 の盤面。board[row][col] が null なら空きマス */
	board: (Piece | null)[][];
	/** 各手番の持ち駒 */
	hands: [Hand, Hand]; // hands[Color.BLACK], hands[Color.WHITE]
	/** 現在の手番 */
	sideToMove: Color;
	/** 手数 */
	moveCount: number;
}

/** ゲーム結果 */
export enum GameResult {
	/** 先手勝ち */
	BLACK_WIN = "BLACK_WIN",
	/** 後手勝ち */
	WHITE_WIN = "WHITE_WIN",
	/** 引き分け */
	DRAW = "DRAW",
	/** まだ終わっていない */
	IN_PROGRESS = "IN_PROGRESS",
}
