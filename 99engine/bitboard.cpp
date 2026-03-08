#include "bitboard.hpp"

Bitboard FILE_MASKS[9];
Bitboard NOT_FILE_MASKS[9];
Bitboard RANK_MASKS[9];
bool masks_initialized = false;

void initMasks()
{
    if (masks_initialized)
        return;
    for (int i = 0; i < 9; ++i)
    {
        FILE_MASKS[i] = 0;
        RANK_MASKS[i] = 0;
    }
    for (int y = 0; y < 9; ++y)
    {
        for (int x = 0; x < 9; ++x)
        {
            Bitboard b = ((Bitboard)1) << (y * 9 + x);
            FILE_MASKS[x] |= b;
            RANK_MASKS[y] |= b;
        }
    }
    for (int i = 0; i < 9; ++i)
    {
        NOT_FILE_MASKS[i] = ~FILE_MASKS[i];
    }
    masks_initialized = true;
}

int pop_lsb(Bitboard &b)
{
    uint64_t low = (uint64_t)b;
    if (low)
    {
        int idx = __builtin_ctzll(low);
        b &= b - 1;
        return idx;
    }
    uint64_t high = (uint64_t)(b >> 64);
    int idx = __builtin_ctzll(high) + 64;
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

Bitboard knightAttacksB(Bitboard b)
{
    return shiftUp(shiftUp(shiftLeft(b))) | shiftUp(shiftUp(shiftRight(b)));
}

Bitboard knightAttacksW(Bitboard b)
{
    return shiftDown(shiftDown(shiftLeft(b))) | shiftDown(shiftDown(shiftRight(b)));
}

Bitboard lanceAttacksB(uint32_t sq, Bitboard occupied)
{
    Bitboard attacks = 0;
    for (int i = 1; i < 9; ++i)
    {
        if ((int)(sq / 9) - i < 0)
            break;
        int s = sq - i * 9;
        attacks |= ((Bitboard)1 << s);
        if (occupied & ((Bitboard)1 << s))
            break;
    }
    return attacks;
}

Bitboard lanceAttacksW(uint32_t sq, Bitboard occupied)
{
    Bitboard attacks = 0;
    for (int i = 1; i < 9; ++i)
    {
        if ((int)(sq / 9) + i > 8)
            break;
        int s = sq + i * 9;
        attacks |= ((Bitboard)1 << s);
        if (occupied & ((Bitboard)1 << s))
            break;
    }
    return attacks;
}

Bitboard rookAttacks(uint32_t sq, Bitboard occupied)
{
    Bitboard attacks = 0;
    for (int i = 1; i < 9; ++i)
    {
        if ((int)(sq / 9) - i < 0)
            break;
        int s = sq - i * 9;
        attacks |= ((Bitboard)1 << s);
        if (occupied & ((Bitboard)1 << s))
            break;
    }
    for (int i = 1; i < 9; ++i)
    {
        if ((int)(sq / 9) + i > 8)
            break;
        int s = sq + i * 9;
        attacks |= ((Bitboard)1 << s);
        if (occupied & ((Bitboard)1 << s))
            break;
    }
    for (int i = 1; i < 9; ++i)
    {
        if ((int)(sq % 9) - i < 0)
            break;
        int s = sq - i;
        attacks |= ((Bitboard)1 << s);
        if (occupied & ((Bitboard)1 << s))
            break;
    }
    for (int i = 1; i < 9; ++i)
    {
        if ((int)(sq % 9) + i > 8)
            break;
        int s = sq + i;
        attacks |= ((Bitboard)1 << s);
        if (occupied & ((Bitboard)1 << s))
            break;
    }
    return attacks;
}

Bitboard bishopAttacks(uint32_t sq, Bitboard occupied)
{
    Bitboard attacks = 0;
    for (int i = 1; i < 9; ++i)
    {
        if ((int)(sq / 9) - i < 0 || (int)(sq % 9) - i < 0)
            break;
        int s = sq - i * 10;
        attacks |= ((Bitboard)1 << s);
        if (occupied & ((Bitboard)1 << s))
            break;
    }
    for (int i = 1; i < 9; ++i)
    {
        if ((int)(sq / 9) - i < 0 || (int)(sq % 9) + i > 8)
            break;
        int s = sq - i * 8;
        attacks |= ((Bitboard)1 << s);
        if (occupied & ((Bitboard)1 << s))
            break;
    }
    for (int i = 1; i < 9; ++i)
    {
        if ((int)(sq / 9) + i > 8 || (int)(sq % 9) - i < 0)
            break;
        int s = sq + i * 8;
        attacks |= ((Bitboard)1 << s);
        if (occupied & ((Bitboard)1 << s))
            break;
    }
    for (int i = 1; i < 9; ++i)
    {
        if ((int)(sq / 9) + i > 8 || (int)(sq % 9) + i > 8)
            break;
        int s = sq + i * 10;
        attacks |= ((Bitboard)1 << s);
        if (occupied & ((Bitboard)1 << s))
            break;
    }
    return attacks;
}
