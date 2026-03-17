import { PieceData,HandPieces } from "./types";

export const USI_TO_DROP_KANJI: Record<string, string> = {
	P: "歩",
	S: "銀",
	G: "金",
	B: "角",
	R: "飛",
};

// 成駒の漢字マッピング
export const PROMOTE_MAP: Record<string, string> = {
	"歩": "と",
	"銀": "全",
	"角": "馬",
	"飛": "龍",
};

// 成駒 → 元の駒
export const DEMOTE_MAP: Record<string, string> = {
	"と": "歩",
	"全": "銀",
	"馬": "角",
	"龍": "飛",
	"竜": "飛",
};

export const INITIAL_BOARD: PieceData[][] = [
	// Row 0 (Gote's back rank)
	[
		{ kanji: "飛", side: "gote" },
		{ kanji: "角", side: "gote" },
		{ kanji: "銀", side: "gote" },
		{ kanji: "金", side: "gote" },
		{ kanji: "王", side: "gote" },
	],
	// Row 1 (Gote's pawn)
	[
		null,
		null,
		null,
		null,
		{ kanji: "歩", side: "gote" },
	],
	// Row 2 (empty)
	[null, null, null, null, null],
	// Row 3 (Sente's pawn)
	[
		{ kanji: "歩", side: "sente" },
		null,
		null,
		null,
		null,
	],
	// Row 4 (Sente's back rank)
	[
		{ kanji: "王", side: "sente" },
		{ kanji: "金", side: "sente" },
		{ kanji: "銀", side: "sente" },
		{ kanji: "角", side: "sente" },
		{ kanji: "飛", side: "sente" },
	],
];

export const INITIAL_HAND: HandPieces = {};
