#pragma once
#include "types.hpp"

extern const Bitboard FILE_5;
extern const Bitboard FILE_4;
extern const Bitboard FILE_3;
extern const Bitboard FILE_2;
extern const Bitboard FILE_1;
extern const Bitboard NOT_FILE_1;
extern const Bitboard NOT_FILE_5;

int pop_lsb(Bitboard &b);

inline Bitboard shiftUp(Bitboard b) { return b >> 5; }
inline Bitboard shiftDown(Bitboard b) { return (b << 5) & 0x01FFFFFF; }
inline Bitboard shiftLeft(Bitboard b) { return (b & NOT_FILE_5) >> 1; }
inline Bitboard shiftRight(Bitboard b) { return (b & NOT_FILE_1) << 1; }

Bitboard kingAttacks(Bitboard b);
Bitboard goldAttacksB(Bitboard b);
Bitboard goldAttacksW(Bitboard b);
Bitboard silverAttacksB(Bitboard b);
Bitboard silverAttacksW(Bitboard b);
inline Bitboard pawnAttacksB(Bitboard b) { return shiftUp(b); }
inline Bitboard pawnAttacksW(Bitboard b) { return shiftDown(b); }
Bitboard rookAttacks(uint32_t sq, Bitboard occupied);
Bitboard bishopAttacks(uint32_t sq, Bitboard occupied);
