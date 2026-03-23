// 5×5 Shogi bitboard utilities – ported from 55engine/bitboard.cpp & bitboard.hpp
import type { Bitboard } from "./types";

const MASK25 = 0x01ffffff;

// File masks (5x5 board: sq = y*5 + x, x=0 is file 5, x=4 is file 1)
export const FILE_5: Bitboard = 0x00108421;
export const FILE_4: Bitboard = 0x00210842;
export const FILE_3: Bitboard = 0x00421084;
export const FILE_2: Bitboard = 0x00842108;
export const FILE_1: Bitboard = 0x01084210;
export const NOT_FILE_1: Bitboard = ~FILE_1 & MASK25;
export const NOT_FILE_5: Bitboard = ~FILE_5 & MASK25;

/**
 * Pop the least significant bit from the bitboard.
 * Returns the index (0-24) and modifies the bitboard (via returned new value).
 */
export function popLsb(b: number): [index: number, remaining: number] {
  // Math.clz32 counts leading zeros in 32 bits; we want trailing zeros
  const idx = 31 - Math.clz32(b & -b);
  return [idx, b & (b - 1)];
}

export function shiftUp(b: Bitboard): Bitboard {
  return (b >>> 5) & MASK25;
}

export function shiftDown(b: Bitboard): Bitboard {
  return (b << 5) & MASK25;
}

export function shiftLeft(b: Bitboard): Bitboard {
  return ((b & NOT_FILE_5) >>> 1) & MASK25;
}

export function shiftRight(b: Bitboard): Bitboard {
  return ((b & NOT_FILE_1) << 1) & MASK25;
}

export function kingAttacks(b: Bitboard): Bitboard {
  const u = shiftUp(b);
  const d = shiftDown(b);
  const l = shiftLeft(b);
  const r = shiftRight(b);
  return (
    u |
    d |
    l |
    r |
    shiftUp(shiftLeft(b)) |
    shiftUp(shiftRight(b)) |
    shiftDown(shiftLeft(b)) |
    shiftDown(shiftRight(b))
  ) & MASK25;
}

export function goldAttacksB(b: Bitboard): Bitboard {
  return (
    shiftUp(b) |
    shiftDown(b) |
    shiftLeft(b) |
    shiftRight(b) |
    shiftUp(shiftLeft(b)) |
    shiftUp(shiftRight(b))
  ) & MASK25;
}

export function goldAttacksW(b: Bitboard): Bitboard {
  return (
    shiftUp(b) |
    shiftDown(b) |
    shiftLeft(b) |
    shiftRight(b) |
    shiftDown(shiftLeft(b)) |
    shiftDown(shiftRight(b))
  ) & MASK25;
}

export function silverAttacksB(b: Bitboard): Bitboard {
  return (
    shiftUp(b) |
    shiftUp(shiftLeft(b)) |
    shiftUp(shiftRight(b)) |
    shiftDown(shiftLeft(b)) |
    shiftDown(shiftRight(b))
  ) & MASK25;
}

export function silverAttacksW(b: Bitboard): Bitboard {
  return (
    shiftDown(b) |
    shiftDown(shiftLeft(b)) |
    shiftDown(shiftRight(b)) |
    shiftUp(shiftLeft(b)) |
    shiftUp(shiftRight(b))
  ) & MASK25;
}

export function pawnAttacksB(b: Bitboard): Bitboard {
  return shiftUp(b);
}

export function pawnAttacksW(b: Bitboard): Bitboard {
  return shiftDown(b);
}

export function rookAttacks(sq: number, occupied: Bitboard): Bitboard {
  let attacks: Bitboard = 0;
  const sqRow = Math.floor(sq / 5);
  const sqCol = sq % 5;

  // Up
  for (let i = 1; i <= 4; i++) {
    if (sqRow - i < 0) break;
    const s = sq - i * 5;
    attacks |= 1 << s;
    if (occupied & (1 << s)) break;
  }
  // Down
  for (let i = 1; i <= 4; i++) {
    if (sqRow + i > 4) break;
    const s = sq + i * 5;
    attacks |= 1 << s;
    if (occupied & (1 << s)) break;
  }
  // Left
  for (let i = 1; i <= 4; i++) {
    if (sqCol - i < 0) break;
    const s = sq - i;
    attacks |= 1 << s;
    if (occupied & (1 << s)) break;
  }
  // Right
  for (let i = 1; i <= 4; i++) {
    if (sqCol + i > 4) break;
    const s = sq + i;
    attacks |= 1 << s;
    if (occupied & (1 << s)) break;
  }

  return attacks & MASK25;
}

export function bishopAttacks(sq: number, occupied: Bitboard): Bitboard {
  let attacks: Bitboard = 0;
  const sqRow = Math.floor(sq / 5);
  const sqCol = sq % 5;

  // Up-Left
  for (let i = 1; i <= 4; i++) {
    if (sqRow - i < 0 || sqCol - i < 0) break;
    const s = sq - i * 6;
    attacks |= 1 << s;
    if (occupied & (1 << s)) break;
  }
  // Up-Right
  for (let i = 1; i <= 4; i++) {
    if (sqRow - i < 0 || sqCol + i > 4) break;
    const s = sq - i * 4;
    attacks |= 1 << s;
    if (occupied & (1 << s)) break;
  }
  // Down-Left
  for (let i = 1; i <= 4; i++) {
    if (sqRow + i > 4 || sqCol - i < 0) break;
    const s = sq + i * 4;
    attacks |= 1 << s;
    if (occupied & (1 << s)) break;
  }
  // Down-Right
  for (let i = 1; i <= 4; i++) {
    if (sqRow + i > 4 || sqCol + i > 4) break;
    const s = sq + i * 6;
    attacks |= 1 << s;
    if (occupied & (1 << s)) break;
  }

  return attacks & MASK25;
}
