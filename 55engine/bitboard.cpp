#include "bitboard.hpp"

#if defined(_MSC_VER)
#include <intrin.h>
#endif

const Bitboard FILE_5 = 0x00108421;
const Bitboard FILE_4 = 0x00210842;
const Bitboard FILE_3 = 0x00421084;
const Bitboard FILE_2 = 0x00842108;
const Bitboard FILE_1 = 0x01084210;
const Bitboard NOT_FILE_1 = ~FILE_1;
const Bitboard NOT_FILE_5 = ~FILE_5;

int pop_lsb(Bitboard &b)
{
#if defined(__GNUC__) || defined(__clang__)
    int idx = __builtin_ctz(b);
#elif defined(_MSC_VER)
    unsigned long idx;
    _BitScanForward(&idx, b);
#else
    int idx = 0;
    Bitboard copy = b;
    while ((copy & 1) == 0)
    {
        copy >>= 1;
        idx++;
    }
#endif
    b &= b - 1;
    return idx;
}

Bitboard kingAttacks(Bitboard b)
{
    Bitboard u = shiftUp(b), d = shiftDown(b), l = shiftLeft(b), r = shiftRight(b);
    return u | d | l | r | shiftUp(shiftLeft(b)) | shiftUp(shiftRight(b)) | shiftDown(shiftLeft(b)) | shiftDown(shiftRight(b));
}

Bitboard goldAttacksB(Bitboard b)
{
    return shiftUp(b) | shiftDown(b) | shiftLeft(b) | shiftRight(b) | shiftUp(shiftLeft(b)) | shiftUp(shiftRight(b));
}

Bitboard goldAttacksW(Bitboard b)
{
    return shiftUp(b) | shiftDown(b) | shiftLeft(b) | shiftRight(b) | shiftDown(shiftLeft(b)) | shiftDown(shiftRight(b));
}

Bitboard silverAttacksB(Bitboard b)
{
    return shiftUp(b) | shiftUp(shiftLeft(b)) | shiftUp(shiftRight(b)) | shiftDown(shiftLeft(b)) | shiftDown(shiftRight(b));
}

Bitboard silverAttacksW(Bitboard b)
{
    return shiftDown(b) | shiftDown(shiftLeft(b)) | shiftDown(shiftRight(b)) | shiftUp(shiftLeft(b)) | shiftUp(shiftRight(b));
}

Bitboard rookAttacks(uint32_t sq, Bitboard occupied)
{
    Bitboard attacks = 0;
    for (int i = 1; i <= 4; ++i)
    {
        if ((int)(sq / 5) - i < 0)
            break;
        int s = sq - i * 5;
        attacks |= (1U << s);
        if (occupied & (1U << s))
            break;
    }
    for (int i = 1; i <= 4; ++i)
    {
        if ((int)(sq / 5) + i > 4)
            break;
        int s = sq + i * 5;
        attacks |= (1U << s);
        if (occupied & (1U << s))
            break;
    }
    for (int i = 1; i <= 4; ++i)
    {
        if ((int)(sq % 5) - i < 0)
            break;
        int s = sq - i;
        attacks |= (1U << s);
        if (occupied & (1U << s))
            break;
    }
    for (int i = 1; i <= 4; ++i)
    {
        if ((int)(sq % 5) + i > 4)
            break;
        int s = sq + i;
        attacks |= (1U << s);
        if (occupied & (1U << s))
            break;
    }
    return attacks;
}

Bitboard bishopAttacks(uint32_t sq, Bitboard occupied)
{
    Bitboard attacks = 0;
    for (int i = 1; i <= 4; ++i)
    {
        if ((int)(sq / 5) - i < 0 || (int)(sq % 5) - i < 0)
            break;
        int s = sq - i * 6;
        attacks |= (1U << s);
        if (occupied & (1U << s))
            break;
    }
    for (int i = 1; i <= 4; ++i)
    {
        if ((int)(sq / 5) - i < 0 || (int)(sq % 5) + i > 4)
            break;
        int s = sq - i * 4;
        attacks |= (1U << s);
        if (occupied & (1U << s))
            break;
    }
    for (int i = 1; i <= 4; ++i)
    {
        if ((int)(sq / 5) + i > 4 || (int)(sq % 5) - i < 0)
            break;
        int s = sq + i * 4;
        attacks |= (1U << s);
        if (occupied & (1U << s))
            break;
    }
    for (int i = 1; i <= 4; ++i)
    {
        if ((int)(sq / 5) + i > 4 || (int)(sq % 5) + i > 4)
            break;
        int s = sq + i * 6;
        attacks |= (1U << s);
        if (occupied & (1U << s))
            break;
    }
    return attacks;
}
