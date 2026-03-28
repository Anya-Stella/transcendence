import { PieceType } from "./types";

// 成り駒かどうかを判定（PieceType で判定）
export function isPromotedPieceType(type: number): boolean {
	return type >= 6; // 0-5 は成りなし、6-9 は成り込み駒
}

// IDから基本の駒種を取得する
export function getBasePieceType(id: string): PieceType {
	if (id.includes("fu")) return PieceType.PAWN;
	if (id.includes("hisya")) return PieceType.ROOK;
	if (id.includes("kaku")) return PieceType.BISHOP;
	if (id.includes("gin")) return PieceType.SILVER;
	if (id.includes("kin")) return PieceType.GOLD;
	return PieceType.KING;
}