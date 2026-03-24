// 5×5 Shogi Board – ported from 55engine/board.cpp
import { Color, PType, type BitMove, type Bitboard, type BoardState, type Piece, type Hand, type Move, type Pos } from "./types";

import {
  popLsb,
  kingAttacks,
  goldAttacksB,
  goldAttacksW,
  silverAttacksB,
  silverAttacksW,
  pawnAttacksB,
  pawnAttacksW,
  rookAttacks,
  bishopAttacks,
} from "./bitboard";

const MASK25 = 0x01ffffff;

export class Board {
  colorBB: [Bitboard, Bitboard] = [0, 0];
  pieceBB: number[] = new Array(PType.PTYPE_MAX).fill(0);
  hand: [number[], number[]] = [
    new Array(PType.PTYPE_MAX).fill(0),
    new Array(PType.PTYPE_MAX).fill(0),
  ];
  sideToMove: Color = Color.BLACK;

  clone(): Board {
    const b = new Board();
    b.colorBB = [this.colorBB[0], this.colorBB[1]];
    b.pieceBB = [...this.pieceBB];
    b.hand = [
      [...this.hand[0]],
      [...this.hand[1]],
    ];
    b.sideToMove = this.sideToMove;
    return b;
  }

  setSfen(sfen: string): boolean {
    this.colorBB = [0, 0];
    this.pieceBB = new Array(PType.PTYPE_MAX).fill(0);
    this.hand = [
      new Array(PType.PTYPE_MAX).fill(0),
      new Array(PType.PTYPE_MAX).fill(0),
    ];

    const parts = sfen.trim().split(/\s+/);
    if (parts.length < 3) return false;

    const [boardStr, colorStr, handStr] = parts;

    if (colorStr === "b") this.sideToMove = Color.BLACK;
    else if (colorStr === "w") this.sideToMove = Color.WHITE;
    else return false;

    let x = 0;
    let y = 0;
    let promoteNext = false;

    for (const c of boardStr) {
      if (c === "/") {
        x = 0;
        y++;
      } else if (c >= "1" && c <= "5") {
        x += parseInt(c);
      } else if (c === "+") {
        promoteNext = true;
      } else {
        const color: Color = c === c.toLowerCase() ? Color.WHITE : Color.BLACK;
        const target = c.toLowerCase();
        let pt: PType = PType.PAWN;

        if (target === "p") pt = promoteNext ? PType.PRO_PAWN : PType.PAWN;
        else if (target === "s") pt = promoteNext ? PType.PRO_SILVER : PType.SILVER;
        else if (target === "g") pt = PType.GOLD;
        else if (target === "b") pt = promoteNext ? PType.PRO_BISHOP : PType.BISHOP;
        else if (target === "r") pt = promoteNext ? PType.PRO_ROOK : PType.ROOK;
        else if (target === "k") pt = PType.KING;

        const sq = y * 5 + x;
        this.colorBB[color] |= 1 << sq;
        this.pieceBB[pt] |= 1 << sq;
        x++;
        promoteNext = false;
      }
    }

    if (handStr !== "-") {
      let count = 1;
      for (const c of handStr) {
        if (c >= "1" && c <= "9") {
          count = parseInt(c);
        } else {
          const color: Color = c === c.toLowerCase() ? Color.WHITE : Color.BLACK;
          const target = c.toLowerCase();
          let pt: PType = PType.PAWN;
          if (target === "p") pt = PType.PAWN;
          else if (target === "s") pt = PType.SILVER;
          else if (target === "g") pt = PType.GOLD;
          else if (target === "b") pt = PType.BISHOP;
          else if (target === "r") pt = PType.ROOK;
          this.hand[color][pt] += count;
          count = 1;
        }
      }
    }

    return true;
  }

  getAttacks(color: Color, occupied: Bitboard): Bitboard {
    let attacks: Bitboard = 0;

    const pawns = this.colorBB[color] & this.pieceBB[PType.PAWN];
    attacks |= color === Color.BLACK ? pawnAttacksB(pawns) : pawnAttacksW(pawns);

    const silvers = this.colorBB[color] & this.pieceBB[PType.SILVER];
    attacks |= color === Color.BLACK ? silverAttacksB(silvers) : silverAttacksW(silvers);

    const golds =
      this.colorBB[color] &
      (this.pieceBB[PType.GOLD] | this.pieceBB[PType.PRO_PAWN] | this.pieceBB[PType.PRO_SILVER]);
    attacks |= color === Color.BLACK ? goldAttacksB(golds) : goldAttacksW(golds);

    const kings = this.colorBB[color] & this.pieceBB[PType.KING];
    if (kings) attacks |= kingAttacks(kings);

    let bishops = this.colorBB[color] & (this.pieceBB[PType.BISHOP] | this.pieceBB[PType.PRO_BISHOP]);
    while (bishops) {
      const [idx, rem] = popLsb(bishops);
      bishops = rem;
      attacks |= bishopAttacks(idx, occupied);
    }

    let rooks = this.colorBB[color] & (this.pieceBB[PType.ROOK] | this.pieceBB[PType.PRO_ROOK]);
    while (rooks) {
      const [idx, rem] = popLsb(rooks);
      rooks = rem;
      attacks |= rookAttacks(idx, occupied);
    }

    const proBishops = this.colorBB[color] & this.pieceBB[PType.PRO_BISHOP];
    if (proBishops) attacks |= kingAttacks(proBishops);

    const proRooks = this.colorBB[color] & this.pieceBB[PType.PRO_ROOK];
    if (proRooks) attacks |= kingAttacks(proRooks);

    return attacks & MASK25;
  }

  isPseudoLegal(m: BitMove): boolean {
    const stm = this.sideToMove;

    // -- Drop --
    if (m.from === -1) {
      if (this.hand[stm][m.dropType] === 0) return false;
      if ((this.colorBB[0] | this.colorBB[1]) & (1 << m.to)) return false;

      if (m.dropType === PType.PAWN) {
        // Nifu
        const f = m.to % 5;
        let fileMask = 0;
        for (let y = 0; y < 5; y++) fileMask |= 1 << (y * 5 + f);
        const myPawns = this.colorBB[stm] & this.pieceBB[PType.PAWN];
        if (myPawns & fileMask) return false;

        // 行き所のない歩
        if (stm === Color.BLACK && Math.floor(m.to / 5) === 0) return false;
        if (stm === Color.WHITE && Math.floor(m.to / 5) === 4) return false;
      }
      return true;
    }

    // -- Board move --
    const fromBB: Bitboard = 1 << m.from;
    const toBB: Bitboard = 1 << m.to;
    if (!(this.colorBB[stm] & fromBB)) return false;
    if (this.colorBB[stm] & toBB) return false;

    // Find piece type at from
    let pt: PType = PType.PAWN;
    for (let i = 0; i < PType.PTYPE_MAX; i++) {
      if (this.pieceBB[i] & fromBB) {
        pt = i as PType;
        break;
      }
    }

    let attacks: Bitboard = 0;
    const occ = this.colorBB[0] | this.colorBB[1];
    if (pt === PType.PAWN) attacks = stm === Color.BLACK ? pawnAttacksB(fromBB) : pawnAttacksW(fromBB);
    else if (pt === PType.SILVER) attacks = stm === Color.BLACK ? silverAttacksB(fromBB) : silverAttacksW(fromBB);
    else if (pt === PType.GOLD || pt === PType.PRO_PAWN || pt === PType.PRO_SILVER)
      attacks = stm === Color.BLACK ? goldAttacksB(fromBB) : goldAttacksW(fromBB);
    else if (pt === PType.KING) attacks = kingAttacks(fromBB);
    else if (pt === PType.BISHOP) attacks = bishopAttacks(m.from, occ);
    else if (pt === PType.ROOK) attacks = rookAttacks(m.from, occ);
    else if (pt === PType.PRO_BISHOP) attacks = bishopAttacks(m.from, occ) | kingAttacks(fromBB);
    else if (pt === PType.PRO_ROOK) attacks = rookAttacks(m.from, occ) | kingAttacks(fromBB);

    if (!(attacks & toBB)) return false;

    // Promotion checks
    if (m.promote) {
      if (pt === PType.KING || pt === PType.GOLD || pt >= PType.PRO_PAWN) return false;
      let canPromote = false;
      if (stm === Color.BLACK && (Math.floor(m.from / 5) === 0 || Math.floor(m.to / 5) === 0))
        canPromote = true;
      if (stm === Color.WHITE && (Math.floor(m.from / 5) === 4 || Math.floor(m.to / 5) === 4))
        canPromote = true;
      if (!canPromote) return false;
    } else {
      // Must promote check
      if (pt === PType.PAWN) {
        if (stm === Color.BLACK && Math.floor(m.to / 5) === 0) return false;
        if (stm === Color.WHITE && Math.floor(m.to / 5) === 4) return false;
      }
    }

    return true;
  }

  makeMove(m: BitMove): void {
    const stm = this.sideToMove;

    if (m.from === -1) {
      // Drop
      this.hand[stm][m.dropType]--;
      this.colorBB[stm] |= 1 << m.to;
      this.pieceBB[m.dropType] |= 1 << m.to;
    } else {
      const fromBB: Bitboard = 1 << m.from;
      const toBB: Bitboard = 1 << m.to;
      this.colorBB[stm] &= ~fromBB;

      // Find piece type at from
      let pt: PType = PType.PAWN;
      for (let i = 0; i < PType.PTYPE_MAX; i++) {
        if (this.pieceBB[i] & fromBB) {
          pt = i as PType;
          this.pieceBB[i] &= ~fromBB;
          break;
        }
      }

      // Capture
      const opp = 1 - stm;
      if (this.colorBB[opp] & toBB) {
        this.colorBB[opp] &= ~toBB;
        let capPt: PType = PType.PAWN;
        for (let i = 0; i < PType.PTYPE_MAX; i++) {
          if (this.pieceBB[i] & toBB) {
            capPt = i as PType;
            this.pieceBB[i] &= ~toBB;
            break;
          }
        }
        // Demote captured piece
        if (capPt === PType.PRO_PAWN) capPt = PType.PAWN;
        else if (capPt === PType.PRO_SILVER) capPt = PType.SILVER;
        else if (capPt === PType.PRO_BISHOP) capPt = PType.BISHOP;
        else if (capPt === PType.PRO_ROOK) capPt = PType.ROOK;

        if (capPt !== PType.KING) {
          this.hand[stm][capPt]++;
        }
      }

      this.colorBB[stm] |= toBB;
      if (m.promote) {
        if (pt === PType.PAWN) pt = PType.PRO_PAWN;
        else if (pt === PType.SILVER) pt = PType.PRO_SILVER;
        else if (pt === PType.BISHOP) pt = PType.PRO_BISHOP;
        else if (pt === PType.ROOK) pt = PType.PRO_ROOK;
      }
      this.pieceBB[pt] |= toBB;
    }

    this.sideToMove = (1 - stm) as Color;
  }

  isKingAttackedAfter(m: BitMove): boolean {
    const next = this.clone();
    next.makeMove(m);
    const nextOpponent = next.sideToMove;
    const oppAttacks = next.getAttacks(nextOpponent, next.colorBB[0] | next.colorBB[1]);
    const myKing = next.colorBB[this.sideToMove] & next.pieceBB[PType.KING];
    return (oppAttacks & myKing) !== 0;
  }

  /**
   * Generate all pseudo-legal moves (same logic as 55engine).
   */
  generatePseudoLegalMoves(): BitMove[] {
    const moves: BitMove[] = [];
    const stm = this.sideToMove;
    const myBB = this.colorBB[stm];
    const occ = this.colorBB[0] | this.colorBB[1];

    for (let i = 0; i < PType.PTYPE_MAX; i++) {
      let pcs = myBB & this.pieceBB[i];
      while (pcs) {
        const [from, rem] = popLsb(pcs);
        pcs = rem;
        let attacks: Bitboard = 0;
        const fromBB: Bitboard = 1 << from;

        if (i === PType.PAWN) attacks = stm === Color.BLACK ? pawnAttacksB(fromBB) : pawnAttacksW(fromBB);
        else if (i === PType.SILVER) attacks = stm === Color.BLACK ? silverAttacksB(fromBB) : silverAttacksW(fromBB);
        else if (i === PType.GOLD || i === PType.PRO_PAWN || i === PType.PRO_SILVER)
          attacks = stm === Color.BLACK ? goldAttacksB(fromBB) : goldAttacksW(fromBB);
        else if (i === PType.KING) attacks = kingAttacks(fromBB);
        else if (i === PType.BISHOP) attacks = bishopAttacks(from, occ);
        else if (i === PType.PRO_BISHOP) attacks = bishopAttacks(from, occ) | kingAttacks(fromBB);
        else if (i === PType.ROOK) attacks = rookAttacks(from, occ);
        else if (i === PType.PRO_ROOK) attacks = rookAttacks(from, occ) | kingAttacks(fromBB);

        attacks &= ~myBB;
        while (attacks) {
          const [to, arem] = popLsb(attacks);
          attacks = arem;

          let canPromote = false;
          let mustPromote = false;

          if (i !== PType.KING && i !== PType.GOLD && i < PType.PRO_PAWN) {
            if (stm === Color.BLACK && (Math.floor(from / 5) === 0 || Math.floor(to / 5) === 0))
              canPromote = true;
            if (stm === Color.WHITE && (Math.floor(from / 5) === 4 || Math.floor(to / 5) === 4))
              canPromote = true;
          }
          if (i === PType.PAWN && canPromote) mustPromote = true;

          if (canPromote) {
            moves.push({ from, to, dropType: PType.PAWN, promote: true });
            if (!mustPromote)
              moves.push({ from, to, dropType: PType.PAWN, promote: false });
          } else {
            moves.push({ from, to, dropType: PType.PAWN, promote: false });
          }
        }
      }
    }

    // Drop moves
    for (let pt = PType.PAWN; pt <= PType.ROOK; pt++) {
      if (
        pt === PType.PRO_PAWN ||
        pt === PType.PRO_SILVER ||
        pt === PType.PRO_BISHOP ||
        pt === PType.PRO_ROOK ||
        pt === PType.KING
      )
        continue;

      if (this.hand[stm][pt] > 0) {
        let empty = ~occ & MASK25;

        if (pt === PType.PAWN) {
          // Nifu check per file
          for (let f = 0; f < 5; f++) {
            let fileMask = 0;
            for (let y = 0; y < 5; y++) fileMask |= 1 << (y * 5 + f);
            if (myBB & this.pieceBB[PType.PAWN] & fileMask) {
              empty &= ~fileMask;
            }
          }
          // Can't drop on last rank
          const lastRank = stm === Color.BLACK ? 0 : 4;
          let lastRankMask = 0;
          for (let f = 0; f < 5; f++) lastRankMask |= 1 << (lastRank * 5 + f);
          empty &= ~lastRankMask;
        }

        empty &= MASK25;
        while (empty) {
          const [to, erem] = popLsb(empty);
          empty = erem;
          moves.push({ from: -1, to, dropType: pt as PType, promote: false });
        }
      }
    }

    return moves;
  }

  /**
   * Generate all legal moves.
   */
  generateLegalMoves(): BitMove[] {
    const pseudo = this.generatePseudoLegalMoves();
    const legal: BitMove[] = [];
    for (const m of pseudo) {
      if (this.isPseudoLegal(m) && !this.isKingAttackedAfter(m)) {
        legal.push(m);
      }
    }
    return legal;
  }

  /**
   * Convert move to USI-style string (e.g. "5a4b", "P*3c", "5a4b+")
   */
  moveToString(m: BitMove): string {
    if (m.from === -1) {
      const ptChars: Record<number, string> = {
        [PType.PAWN]: "P",
        [PType.SILVER]: "S",
        [PType.GOLD]: "G",
        [PType.BISHOP]: "B",
        [PType.ROOK]: "R",
      };
      const p = ptChars[m.dropType] ?? "?";
      const f = 5 - (m.to % 5);
      const r = String.fromCharCode("a".charCodeAt(0) + Math.floor(m.to / 5));
      return `${p}*${f}${r}`;
    } else {
      const fFrom = 5 - (m.from % 5);
      const rFrom = String.fromCharCode("a".charCodeAt(0) + Math.floor(m.from / 5));
      const fTo = 5 - (m.to % 5);
      const rTo = String.fromCharCode("a".charCodeAt(0) + Math.floor(m.to / 5));
      return `${fFrom}${rFrom}${fTo}${rTo}${m.promote ? "+" : ""}`;
    }
  }

  /**
   * Convert to SFEN string.
   */
  toSfen(): string {
    let boardStr = "";
    for (let y = 0; y < 5; y++) {
      let empty = 0;
      for (let x = 0; x < 5; x++) {
        const sq = y * 5 + x;
        const sqBB = 1 << sq;
        let found = false;

        for (let c = 0; c < 2; c++) {
          if (this.colorBB[c] & sqBB) {
            if (empty > 0) {
              boardStr += empty.toString();
              empty = 0;
            }
            // Find piece type
            for (let pt = 0; pt < PType.PTYPE_MAX; pt++) {
              if (this.pieceBB[pt] & sqBB) {
                const promoted = pt >= PType.PRO_PAWN;
                let basePt = pt;
                if (pt === PType.PRO_PAWN) basePt = PType.PAWN;
                else if (pt === PType.PRO_SILVER) basePt = PType.SILVER;
                else if (pt === PType.PRO_BISHOP) basePt = PType.BISHOP;
                else if (pt === PType.PRO_ROOK) basePt = PType.ROOK;

                const ptChars: Record<number, string> = {
                  [PType.PAWN]: "p",
                  [PType.SILVER]: "s",
                  [PType.GOLD]: "g",
                  [PType.BISHOP]: "b",
                  [PType.ROOK]: "r",
                  [PType.KING]: "k",
                };
                let ch = ptChars[basePt] ?? "?";
                if (c === Color.BLACK) ch = ch.toUpperCase();
                if (promoted) boardStr += "+";
                boardStr += ch;
                found = true;
                break;
              }
            }
            if (found) break;
          }
        }

        if (!found) empty++;
      }
      if (empty > 0) boardStr += empty.toString();
      if (y < 4) boardStr += "/";
    }

    const colorStr = this.sideToMove === Color.BLACK ? "b" : "w";

    let handStr = "";
    const handPieces: [number, string][] = [
      [PType.ROOK, "R"],
      [PType.BISHOP, "B"],
      [PType.GOLD, "G"],
      [PType.SILVER, "S"],
      [PType.PAWN, "P"],
    ];

    for (const [pt, ch] of handPieces) {
      const bc = this.hand[Color.BLACK][pt];
      if (bc > 0) {
        if (bc > 1) handStr += bc.toString();
        handStr += ch;
      }
    }
    for (const [pt, ch] of handPieces) {
      const wc = this.hand[Color.WHITE][pt];
      if (wc > 0) {
        if (wc > 1) handStr += wc.toString();
        handStr += ch.toLowerCase();
      }
    }

    if (handStr === "") handStr = "-";

    return `${boardStr} ${colorStr} ${handStr} 1`;
  }
}

// ---- Conversion helpers between MatchBoard's (row,col) and engine's sq ----

/**
 * Convert MatchBoard's PieceData[][] to a Board instance.
 * MatchBoard layout:
 *   Row 0 = Gote's back rank (rank a) → y=0
 *   Row 4 = Sente's back rank (rank e) → y=4
 *   Col 0 = file 5 (leftmost)  → x=0
 *   Col 4 = file 1 (rightmost) → x=4
 * Engine layout:
 *   sq = y * 5 + x (same ordering)
 */
export interface PieceInfo {
  kanji: string;
  side: "sente" | "gote";
}

const KANJI_TO_PTYPE: Record<string, PType> = {
  "歩": PType.PAWN,
  "銀": PType.SILVER,
  "金": PType.GOLD,
  "角": PType.BISHOP,
  "飛": PType.ROOK,
  "王": PType.KING,
  "玉": PType.KING,
  "と": PType.PRO_PAWN,
  "全": PType.PRO_SILVER,
  "馬": PType.PRO_BISHOP,
  "龍": PType.PRO_ROOK,
  "竜": PType.PRO_ROOK,
};

const PTYPE_TO_KANJI_SENTE: Record<number, string> = {
  [PType.PAWN]: "歩",
  [PType.SILVER]: "銀",
  [PType.GOLD]: "金",
  [PType.BISHOP]: "角",
  [PType.ROOK]: "飛",
  [PType.KING]: "王",
  [PType.PRO_PAWN]: "と",
  [PType.PRO_SILVER]: "全",
  [PType.PRO_BISHOP]: "馬",
  [PType.PRO_ROOK]: "龍",
};

export function boardFromPieces(
  pieces: (PieceInfo | null)[][],
  turn: "sente" | "gote",
  senteHand: Record<string, number>,
  goteHand: Record<string, number>
): Board {
  const board = new Board();
  board.sideToMove = turn === "sente" ? Color.BLACK : Color.WHITE;

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const piece = pieces[row][col];
      if (!piece) continue;

      const sq = row * 5 + col;
      const color = piece.side === "sente" ? Color.BLACK : Color.WHITE;
      const pt = KANJI_TO_PTYPE[piece.kanji];
      if (pt === undefined) continue;

      board.colorBB[color] |= 1 << sq;
      board.pieceBB[pt] |= 1 << sq;
    }
  }

  // Hands
  const handKanjiMap: Record<string, PType> = {
    "歩": PType.PAWN,
    "銀": PType.SILVER,
    "金": PType.GOLD,
    "角": PType.BISHOP,
    "飛": PType.ROOK,
  };
  for (const [kanji, pt] of Object.entries(handKanjiMap)) {
    board.hand[Color.BLACK][pt] = senteHand[kanji] ?? 0;
    board.hand[Color.WHITE][pt] = goteHand[kanji] ?? 0;
  }

  return board;
}

/**
 * Given the current board state as pieces, turn, and hands,
 * return the set of legal destination squares for a piece at (row, col).
 * Returns a map of `${row}-${col}` -> { promote: boolean, canPromote: boolean }
 */
export interface LegalTarget {
  row: number;
  col: number;
  promote: boolean;
  canPromote: boolean; // true if promotion is optional
  mustPromote: boolean; // true if promotion is forced
}

export function getLegalMovesForPiece(
  pieces: (PieceInfo | null)[][],
  turn: "sente" | "gote",
  senteHand: Record<string, number>,
  goteHand: Record<string, number>,
  fromRow: number,
  fromCol: number
): LegalTarget[] {
  const board = boardFromPieces(pieces, turn, senteHand, goteHand);
  const legalMoves = board.generateLegalMoves();

  const fromSq = fromRow * 5 + fromCol;
  const targets: LegalTarget[] = [];
  const targetMap = new Map<number, { promote: boolean; noPromote: boolean }>();

  for (const m of legalMoves) {
    if (m.from !== fromSq) continue;

    const existing = targetMap.get(m.to);
    if (existing) {
      if (m.promote) existing.promote = true;
      else existing.noPromote = true;
    } else {
      targetMap.set(m.to, {
        promote: m.promote,
        noPromote: !m.promote,
      });
    }
  }

  Array.from(targetMap.entries()).forEach(([toSq, info]) => {
    const row = Math.floor(toSq / 5);
    const col = toSq % 5;
    targets.push({
      row,
      col,
      promote: info.promote,
      canPromote: info.promote && info.noPromote,
      mustPromote: info.promote && !info.noPromote,
    });
  });

  return targets;
}

/**
 * Get legal drop positions for a given piece type from hand.
 */
export function getLegalDrops(
  pieces: (PieceInfo | null)[][],
  turn: "sente" | "gote",
  senteHand: Record<string, number>,
  goteHand: Record<string, number>,
  dropKanji: string
): { row: number; col: number }[] {
  const board = boardFromPieces(pieces, turn, senteHand, goteHand);
  const legalMoves = board.generateLegalMoves();
  const dropPt = KANJI_TO_PTYPE[dropKanji];
  if (dropPt === undefined) return [];

  const targets: { row: number; col: number }[] = [];
  for (const m of legalMoves) {
    if (m.from === -1 && m.dropType === dropPt) {
      targets.push({
        row: Math.floor(m.to / 5),
        col: m.to % 5,
      });
    }
  }
  return targets;
}

/**
 * Check if a specific board move (from -> to) is legal, optionally with promotion.
 */
export function isMoveFromToLegal(
  pieces: (PieceInfo | null)[][],
  turn: "sente" | "gote",
  senteHand: Record<string, number>,
  goteHand: Record<string, number>,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  promote: boolean
): boolean {
  const board = boardFromPieces(pieces, turn, senteHand, goteHand);
  const m: BitMove = {
    from: fromRow * 5 + fromCol,
    to: toRow * 5 + toCol,
    dropType: PType.PAWN,
    promote,
  };
  return board.isPseudoLegal(m) && !board.isKingAttackedAfter(m);
}

/**
 * Check if the active player has any legal moves. If false, the player is checkmated.
 */
export function hasLegalMoves(
  pieces: (PieceInfo | null)[][],
  turn: "sente" | "gote",
  senteHand: Record<string, number>,
  goteHand: Record<string, number>
): boolean {
  const board = boardFromPieces(pieces, turn, senteHand, goteHand);
  const mvs = board.generateLegalMoves();
  return mvs.length > 0;
}

export function apply(currentSfen: string, data: {
  from?: { row: number; col: number };
  to: { row: number; col: number };
  promote?: boolean;
  drop?: string;
}): string {
  const board = new Board();

  if (!board.setSfen(currentSfen)) {
    console.error("Invalid SFEN:", currentSfen);
    return currentSfen;
  }

  if (data.drop) {
    const pt = KANJI_TO_PTYPE[data.drop];
    board.makeMove({
      from: -1,
      to: data.to.row * 5 + data.to.col,
      dropType: pt,
      promote: false,
    });
  } else if (data.from) {
    board.makeMove({
      from: data.from.row * 5 + data.from.col,
      to: data.to.row * 5 + data.to.col,
      dropType: 0, // ダミー
      promote: data.promote ?? false,
    });
  }

  return board.toSfen();
}

// ---- BoardState conversion and helpers ----

export function generateLegalMoves(state: BoardState): Move[] {
  const board = boardFromState(state);
  return board.generateLegalMoves().map(bm => bitMoveToMove(bm));
}

export function isLegalMove(state: BoardState, move: Move): boolean {
  const board = boardFromState(state);
  const bm = moveToBitMove(move);
  return board.isPseudoLegal(bm) && !board.isKingAttackedAfter(bm);
}

export function applyMove(state: BoardState, move: Move): BoardState {
  const board = boardFromState(state);
  const bm = moveToBitMove(move);
  board.makeMove(bm);
  const nextState = boardToState(board);
  nextState.moveCount = state.moveCount + 1;
  return nextState;
}

export function boardFromState(state: BoardState): Board {
  const b = new Board();
  b.sideToMove = state.sideToMove;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const p = state.board[r][c];
      if (p) {
        const sq = r * 5 + c;
        b.colorBB[p.color] |= (1 << sq);
        b.pieceBB[p.pieceType] |= (1 << sq);
      }
    }
  }
  for (let color = 0; color < 2; color++) {
    for (let pt = 0; pt < PType.PTYPE_MAX; pt++) {
      b.hand[color][pt] = state.hands[color][pt] || 0;
    }
  }
  return b;
}

export function boardToState(b: Board): BoardState {
  const board: (Piece | null)[][] = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => null));
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const sq = r * 5 + c;
      const sqBB = 1 << sq;
      for (let color = 0; color < 2; color++) {
        if (b.colorBB[color] & sqBB) {
          for (let pt = 0; pt < PType.PTYPE_MAX; pt++) {
            if (b.pieceBB[pt] & sqBB) {
              board[r][c] = { color: color as Color, pieceType: pt as PType };
              break;
            }
          }
          break;
        }
      }
    }
  }
  const hands: [Hand, Hand] = [{}, {}];
  for (let color = 0; color < 2; color++) {
    for (let pt = 0; pt < PType.PTYPE_MAX; pt++) {
      if (b.hand[color][pt] > 0) {
        hands[color][pt] = b.hand[color][pt];
      }
    }
  }
  return {
    board,
    hands,
    sideToMove: b.sideToMove,
    moveCount: 0,
  };
}

function bitMoveToMove(bm: BitMove): Move {
  const to: Pos = { row: Math.floor(bm.to / 5), col: bm.to % 5 };
  if (bm.from === -1) {
    return {
      to,
      promote: false,
      type: "drop",
      pieceType: bm.dropType,
    };
  } else {
    return {
      from: { row: Math.floor(bm.from / 5), col: bm.from % 5 },
      to,
      promote: bm.promote,
      type: "move",
    };
  }
}

function moveToBitMove(m: Move): BitMove {
  const to = m.to.row * 5 + m.to.col;
  if (m.type === "drop") {
    return {
      to,
      from: -1,
      dropType: m.pieceType as PType,
      promote: false,
    };
  } else {
    return {
      to,
      from: m.from.row * 5 + m.from.col,
      dropType: PType.PAWN, // ignored for board moves
      promote: m.promote,
    };
  }
}


export { KANJI_TO_PTYPE, PTYPE_TO_KANJI_SENTE };

