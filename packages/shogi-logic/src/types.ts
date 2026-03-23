// 5×5 Shogi types – ported from 55engine/types.hpp
export type Bitboard = number; // uint32 (only lower 25 bits used)

// const enum は実行時に参照できない場合があるため、
// ブラウザでの実行時エラー (PieceType.PAWN が undefined) を防ぐため通常の enum を使用します。

export enum Color {
  BLACK = 0, // 先手
  WHITE = 1, // 後手
}

export enum PType {
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

// 互換性のための enum 定義
export enum PieceType {
  PAWN = PType.PAWN,
  SILVER = PType.SILVER,
  GOLD = PType.GOLD,
  BISHOP = PType.BISHOP,
  ROOK = PType.ROOK,
  KING = PType.KING,
}

export enum PromotedPieceType {
  PRO_PAWN = PType.PRO_PAWN,
  PRO_SILVER = PType.PRO_SILVER,
  PRO_BISHOP = PType.PRO_BISHOP,
  PRO_ROOK = PType.PRO_ROOK,
}

export type Piece = {
  color: Color;
  pieceType: PType | PieceType | PromotedPieceType;
};

export type Hand = Record<number, number>;

export type BoardState = {
  board: (Piece | null)[][];
  hands: [Hand, Hand];
  sideToMove: Color;
  moveCount: number;
};

export type BitMove = {
  from: number;
  to: number;
  dropType: PType;
  promote: boolean;
}

export type PieceData = {
  kanji: string;
  side: "sente" | "gote";
} | null;

export type UIBoard = {
  board: PieceData[][],
  senteHand: HandPieces;
  goteHand: HandPieces;
  turn: "sente" | "gote",
};

export type Move = {
  to: Pos;
} & (
  | { type: "move"; from: Pos; promote: boolean }
  | { type: "drop"; pieceType: PType | PieceType; promote?: boolean }
);





export type Drop = {
  to: Pos,
  kanji: string,
}

export type Pos = {
  row: number,
  col: number,
};

export type Square = Pos;


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
