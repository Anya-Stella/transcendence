// 5×5 Shogi types – ported from 55engine/types.hpp
export type Bitboard = number; // uint32 (only lower 25 bits used)

export const enum Color {
  BLACK = 0, // 先手
  WHITE = 1, // 後手
}

export const enum PType {
  PAWN = 0,
  SILVER = 1,
  GOLD = 2,
  BISHOP = 3,
  ROOK = 4,
  KING = 5,
  PRO_PAWN = 6,
  PRO_SILVER = 7,
  PRO_BISHOP = 8,
  PRO_ROOK = 9,
  PTYPE_MAX = 10,
}

export type BitMove = {
  from: number;
  to: number;
  dropType: PType;
  promote: boolean;
}

export type PieceData = {
	kanji: string;
	side: "sente" | "gote";
}|null;

export type ShogiPosition = {
  board: PieceData[][],
  senteHand: HandPieces;
  goteHand: HandPieces;
  trun: "sente" | "gote",
};

export type Move = {
  from: Pos,
  to: Pos,
  promote: boolean,
}

export type Drop = {
  to:Pos,
  kanji: string,
}

export type Pos = {
  row: number,
  col:number,
};

export type HandPieces = Record<string, number>;

export type GameState = {
  board: PieceData[][];
  senteHand: HandPieces;
  goteHand: HandPieces;
  turn: "sente" | "gote";
  selected: Pos | null;
  selectedHandPiece: string | null;
  promoteDialog: { from: Pos; to: Pos } | null;
  gameResult: {
    isOver: boolean;
    winner: "sente" | "gote" | "draw" | null;
    message: string | null;
  };
};
