#pragma once
#include <cstdint>
#include <string>

typedef unsigned __int128 Bitboard;

enum Color
{
    BLACK = 0,
    WHITE = 1,
    NO_COLOR = 2
};

enum PType
{
    PAWN = 0,
    LANCE,
    KNIGHT,
    SILVER,
    GOLD,
    BISHOP,
    ROOK,
    KING,
    PRO_PAWN,
    PRO_LANCE,
    PRO_KNIGHT,
    PRO_SILVER,
    PRO_BISHOP,
    PRO_ROOK,
    PTYPE_MAX
};

struct Move
{
    int from; // -1 for drop
    int to;
    PType drop_type;
    bool promote;
};
