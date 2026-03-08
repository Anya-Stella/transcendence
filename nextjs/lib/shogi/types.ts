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

export interface Move {
  from: number; // -1 for drop
  to: number;
  dropType: PType;
  promote: boolean;
}
