// ============================================================
// @torassen/shogi-logic — 5×5 Mini Shogi constants
// ============================================================

import { Color, PieceType, PromotedPieceType, type Piece, type BoardState, type Hand, Square, PType } from "./types";

/** 盤面サイズ */
export const BOARD_SIZE = 5;

/** 初期局面の SFEN 文字列 (5×5 将棋) */
export const INITIAL_SFEN = "rbsgk/4p/5/P4/KGSBR b - 1"; // TODO: SFENの修正が必要な場合は再構築
// 修正前の SFEN: "rbsgk/4p/5/P4/KGSBR b - 1" (飛角銀金王 / ・・歩 / ... / 王金銀角飛)
// 新しい SFEN を計算し直す必要があるかもしれません。
// 飛:r, 角:b, 銀:s, 金:g, 王:k
// 行0: rbsgk (飛角銀金王)
// 行1: 4p (空空空空歩)
// 行2: 5
// 行3: P4 (歩空空空空)
// 行4: KGSBR (王金銀角飛)
// 行き先も同じなので INITIAL_SFEN = "rbsgk/4p/5/P4/KGSBR b - 1" のままで合っています。
// ※以前のSFENは "ksgbr/4p/5/P4/RBSGK b - 1" だった可能性がありますが、
// 現在の INITIAL_SFEN は既に修正後の意図（rbsgk...）に沿っているようです。
// コード内の生成ロジックと SFEN を確実に一致させます。

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

export const PIECE_INITIAL_GRID: Record<string, Square> = {
	"sente-ou": { row: 4, col: 0 },
	"sente-kin": { row: 4, col: 1 },
	"sente-gin": { row: 4, col: 2 },
	"sente-kaku": { row: 4, col: 3 },
	"sente-hisya": { row: 4, col: 4 },
	"sente-fu": { row: 3, col: 0 },
	"gote-ou": { row: 0, col: 4 },
	"gote-kin": { row: 0, col: 3 },
	"gote-gin": { row: 0, col: 2 },
	"gote-kaku": { row: 0, col: 1 },
	"gote-hisya": { row: 0, col: 0 },
	"gote-fu": { row: 1, col: 4 },
};

// 駒台の座標定義
export const SENTE_HAND_COORDS: Partial<Record<PieceType, [number, number, number]>> = {
	[PieceType.PAWN]: [-3, 10.0, 10.2],
	[PieceType.ROOK]: [-3, 10.0, 13.2],
	[PieceType.BISHOP]: [-3, 10.0, 16.2],
	[PieceType.SILVER]: [-7.1, 10.0, 10.2],
	[PieceType.GOLD]: [-7.1, 10.0, 13.2],
};

export const GOTE_HAND_COORDS: Partial<Record<PieceType, [number, number, number]>> = {
	[PieceType.PAWN]: [-2.7, 10.0, -10.2],
	[PieceType.ROOK]: [-2.7, 10.0, -13.2],
	[PieceType.BISHOP]: [-2.7, 10.0, -16.2],
	[PieceType.SILVER]: [1.5, 10.0, -10.2],
	[PieceType.GOLD]: [1.5, 10.0, -13.2],
};

export const SENTE_PIECES_CONFIG = [
	{ id: "sente-ou", model: "/models/ousyo.glb", defaultPos: [-9.1, 10.0, -6.4] as [number, number, number] },
	{ id: "sente-kin", model: "/models/kin.glb", defaultPos: [-9.1, 10.0, -3.2] as [number, number, number] },
	{ id: "sente-gin", model: "/models/gin.glb", defaultPos: [-9.1, 10.0, 0.0] as [number, number, number] },
	{ id: "sente-kaku", model: "/models/kaku.glb", defaultPos: [-9.1, 10.0, 3.2] as [number, number, number] },
	{ id: "sente-hisya", model: "/models/hisya.glb", defaultPos: [-9.1, 10.0, 6.4] as [number, number, number] },
	{ id: "sente-fu", model: "/models/fu.glb", defaultPos: [-6, 10.0, -6.4] as [number, number, number] },
];

export const HAND_PIECE_COORDS = 
[
	{
		[PType.PAWN]: [-3, 10.0, 10.2],
		[PType.ROOK]: [-3, 10.0, 13.2],
		[PType.BISHOP]: [-3, 10.0, 16.2],
		[PType.SILVER]: [-7.1, 10.0, 10.2],
		[PType.GOLD]: [-7.1, 10.0, 13.2],
	},
	{
		[PType.PAWN]: [-2.7, 10.0, -10.2],
		[PType.ROOK]: [-2.7, 10.0, -13.2],
		[PType.BISHOP]: [-2.7, 10.0, -16.2],
		[PType.SILVER]: [1.5, 10.0, -10.2],
		[PType.GOLD]: [1.5, 10.0, -13.2],
	}
]

export const GOTE_PIECES_CONFIG = [
	{ id: "gote-ou", model: "/models/ousyo_NoTen.glb", defaultPos: [3.9, 10.0, 6.4] as [number, number, number] },
	{ id: "gote-kin", model: "/models/kin.glb", defaultPos: [3.9, 10.0, 3.2] as [number, number, number] },
	{ id: "gote-gin", model: "/models/gin.glb", defaultPos: [3.9, 10.0, 0] as [number, number, number] },
	{ id: "gote-kaku", model: "/models/kaku.glb", defaultPos: [3.9, 10.0, -3.2] as [number, number, number] },
	{ id: "gote-hisya", model: "/models/hisya.glb", defaultPos: [3.9, 10.0, -6.4] as [number, number, number] },
	{ id: "gote-fu", model: "/models/fu.glb", defaultPos: [0.6, 10.0, 6.4] as [number, number, number] },
];

export const MODEL: Record<PType, string> = {
    [PType.PAWN]: "/models/fu.glb",
    [PType.SILVER]: "/models/gin.glb",
	[PType.GOLD] : "/models/kin.glb",
	[PType.BISHOP] : "/models/kaku.glb",
	[PType.ROOK] : "/models/hisya.glb",
	[PType.KING] : "/models/ousyo.glb",
	[PType.PRO_PAWN] : "/models/fu.glb",
	[PType.PRO_SILVER] : "/models/gin.glb",
	[PType.PRO_BISHOP] : "/models/kaku.glb",
	[PType.PRO_ROOK] : "/models/hisya.glb",
	[PType.PTYPE_MAX] : "/models/ginsho.glb",
};

/** 初期盤面を生成 */
export function createInitialBoard(): BoardState {
	const board: (Piece | null)[][] = Array.from({ length: BOARD_SIZE }, () =>
		Array.from({ length: BOARD_SIZE }, () => null),
	);

	// 後手 (WHITE) — 上段 row=0
	// 飛角銀金王 → col 0..4
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
	// 王金銀角飛 → col 0..4
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

// 盤面のグリッド座標定義（5×5）
// Row 0 (後手側: X=3.9) → Row 4 (先手側: X=-9.1)
// Col 0 (左: Z=-6.4) → Col 4 (右: Z=6.4)
export const BOARD_X_COORDS = [3.9, 0.6, -2.7, -6.0, -9.1];
export const BOARD_Z_COORDS = [-6.4, -3.2, 0, 3.2, 6.4];
export const BOARD_Y = 10.0;       // 駒の Y 座標（高さ）
