#pragma once
#include <cstdint>
#include <string>

typedef uint32_t Bitboard;

enum Color
{
    BLACK = 0,
    WHITE = 1,
    NO_COLOR = 2
};

enum PType
{
    PAWN,
    SILVER,
    GOLD,
    BISHOP,
    ROOK,
    KING,
    PRO_PAWN,
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
