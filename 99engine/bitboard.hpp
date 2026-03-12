#pragma once
#include "types.hpp"

extern Bitboard FILE_MASKS[9];
extern Bitboard NOT_FILE_MASKS[9];
extern Bitboard RANK_MASKS[9];

void initMasks();

int pop_lsb(Bitboard &b);

inline Bitboard shiftUp(Bitboard b) { return b >> 9; }
inline Bitboard shiftDown(Bitboard b) { return b << 9; }
inline Bitboard shiftLeft(Bitboard b) { return (b & NOT_FILE_MASKS[0]) >> 1; }
inline Bitboard shiftRight(Bitboard b) { return (b & NOT_FILE_MASKS[8]) << 1; }

Bitboard kingAttacks(Bitboard b);
Bitboard goldAttacksB(Bitboard b);
Bitboard goldAttacksW(Bitboard b);
Bitboard silverAttacksB(Bitboard b);
Bitboard silverAttacksW(Bitboard b);
inline Bitboard pawnAttacksB(Bitboard b) { return shiftUp(b); }
inline Bitboard pawnAttacksW(Bitboard b) { return shiftDown(b); }
Bitboard knightAttacksB(Bitboard b);
Bitboard knightAttacksW(Bitboard b);
Bitboard lanceAttacksB(uint32_t sq, Bitboard occupied);
Bitboard lanceAttacksW(uint32_t sq, Bitboard occupied);
Bitboard rookAttacks(uint32_t sq, Bitboard occupied);
Bitboard bishopAttacks(uint32_t sq, Bitboard occupied);
