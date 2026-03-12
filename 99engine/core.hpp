#pragma once

#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <cctype>
#include <cstdint>

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

Bitboard shiftUp(Bitboard b) { return b >> 9; }
Bitboard shiftDown(Bitboard b) { return b << 9; }
Bitboard shiftLeft(Bitboard b) { return (b & NOT_FILE_MASKS[0]) >> 1; }
Bitboard shiftRight(Bitboard b) { return (b & NOT_FILE_MASKS[8]) << 1; }

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

Bitboard pawnAttacksB(Bitboard b) { return shiftUp(b); }
Bitboard pawnAttacksW(Bitboard b) { return shiftDown(b); }

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

struct Move
{
    int from; // -1 for drop
    int to;
    PType drop_type;
    bool promote;
};

bool parseMove(std::string str, Move &m)
{
    if (str.length() >= 4 && str[1] == '*')
    {
        m.from = -1;
        char p = std::toupper(str[0]);
        if (p == 'P')
            m.drop_type = PAWN;
        else if (p == 'L')
            m.drop_type = LANCE;
        else if (p == 'N')
            m.drop_type = KNIGHT;
        else if (p == 'S')
            m.drop_type = SILVER;
        else if (p == 'G')
            m.drop_type = GOLD;
        else if (p == 'B')
            m.drop_type = BISHOP;
        else if (p == 'R')
            m.drop_type = ROOK;
        else
            return false;

        int f = str[2] - '0';
        char r = str[3];
        int x = 9 - f;
        int y = (r >= 'a' && r <= 'i') ? (r - 'a') : (r - '1');
        if (x < 0 || x > 8 || y < 0 || y > 8)
            return false;
        m.to = y * 9 + x;
        m.promote = false;
        return true;
    }
    else if (str.length() >= 4)
    {
        int f_from = str[0] - '0';
        char r_from = str[1];
        int x_from = 9 - f_from;
        int y_from = (r_from >= 'a' && r_from <= 'i') ? (r_from - 'a') : (r_from - '1');
        if (x_from < 0 || x_from > 8 || y_from < 0 || y_from > 8)
            return false;
        m.from = y_from * 9 + x_from;

        int f_to = str[2] - '0';
        char r_to = str[3];
        int x_to = 9 - f_to;
        int y_to = (r_to >= 'a' && r_to <= 'i') ? (r_to - 'a') : (r_to - '1');
        if (x_to < 0 || x_to > 8 || y_to < 0 || y_to > 8)
            return false;
        m.to = y_to * 9 + x_to;

        m.promote = (str.length() == 5 && str[4] == '+');
        return true;
    }
    return false;
}

class Board
{
public:
    Bitboard colorBB[2];
    Bitboard pieceBB[15];
    int hand[2][15];
    Color sideToMove;

    Board() { initMasks(); }

    bool set_sfen(const std::string &sfen)
    {
        initMasks();
        for (int i = 0; i < 2; ++i)
            colorBB[i] = 0;
        for (int i = 0; i < PTYPE_MAX; ++i)
            pieceBB[i] = 0;
        for (int i = 0; i < 2; ++i)
            for (int j = 0; j < PTYPE_MAX; ++j)
                hand[i][j] = 0;

        std::stringstream ss(sfen);
        std::string board_str, color_str, hand_str;
        if (!(ss >> board_str >> color_str >> hand_str))
            return false;

        if (color_str == "b")
            sideToMove = BLACK;
        else if (color_str == "w")
            sideToMove = WHITE;
        else
            return false;

        int x = 0, y = 0;
        bool promote_next = false;
        for (char c : board_str)
        {
            if (c == '/')
            {
                x = 0;
                y++;
            }
            else if (c >= '1' && c <= '9')
            {
                x += c - '0';
            }
            else if (c == '+')
            {
                promote_next = true;
            }
            else
            {
                Color color = std::islower(c) ? WHITE : BLACK;
                char target = std::tolower(c);
                PType pt = PAWN;
                if (target == 'p')
                    pt = promote_next ? PRO_PAWN : PAWN;
                else if (target == 'l')
                    pt = promote_next ? PRO_LANCE : LANCE;
                else if (target == 'n')
                    pt = promote_next ? PRO_KNIGHT : KNIGHT;
                else if (target == 's')
                    pt = promote_next ? PRO_SILVER : SILVER;
                else if (target == 'g')
                    pt = GOLD;
                else if (target == 'b')
                    pt = promote_next ? PRO_BISHOP : BISHOP;
                else if (target == 'r')
                    pt = promote_next ? PRO_ROOK : ROOK;
                else if (target == 'k')
                    pt = KING;

                int sq = y * 9 + x;
                colorBB[color] |= ((Bitboard)1 << sq);
                pieceBB[pt] |= ((Bitboard)1 << sq);
                x++;
                promote_next = false;
            }
        }

        if (hand_str != "-")
        {
            int count = 0;
            for (char c : hand_str)
            {
                if (c >= '0' && c <= '9')
                {
                    count = count * 10 + (c - '0');
                }
                else
                {
                    auto color = std::islower(c) ? WHITE : BLACK;
                    char target = std::tolower(c);
                    PType pt = PAWN;
                    if (target == 'p')
                        pt = PAWN;
                    else if (target == 'l')
                        pt = LANCE;
                    else if (target == 'n')
                        pt = KNIGHT;
                    else if (target == 's')
                        pt = SILVER;
                    else if (target == 'g')
                        pt = GOLD;
                    else if (target == 'b')
                        pt = BISHOP;
                    else if (target == 'r')
                        pt = ROOK;

                    int n = (count == 0) ? 1 : count;
                    hand[color][pt] += n;
                    count = 0;
                }
            }
        }
        return true;
    }

    Bitboard getAttacks(Color color, Bitboard occupied)
    {
        Bitboard attacks = 0;
        Bitboard pawns = colorBB[color] & pieceBB[PAWN];
        attacks |= (color == BLACK) ? pawnAttacksB(pawns) : pawnAttacksW(pawns);

        Bitboard lances = colorBB[color] & pieceBB[LANCE];
        while (lances)
            attacks |= (color == BLACK) ? lanceAttacksB(pop_lsb(lances), occupied) : lanceAttacksW(pop_lsb(lances), occupied);

        Bitboard knights = colorBB[color] & pieceBB[KNIGHT];
        attacks |= (color == BLACK) ? knightAttacksB(knights) : knightAttacksW(knights);

        Bitboard silvers = colorBB[color] & pieceBB[SILVER];
        attacks |= (color == BLACK) ? silverAttacksB(silvers) : silverAttacksW(silvers);

        Bitboard golds = colorBB[color] & (pieceBB[GOLD] | pieceBB[PRO_PAWN] | pieceBB[PRO_LANCE] | pieceBB[PRO_KNIGHT] | pieceBB[PRO_SILVER]);
        attacks |= (color == BLACK) ? goldAttacksB(golds) : goldAttacksW(golds);

        Bitboard kings = colorBB[color] & pieceBB[KING];
        if (kings)
            attacks |= kingAttacks(kings);

        Bitboard bishops = colorBB[color] & (pieceBB[BISHOP] | pieceBB[PRO_BISHOP]);
        while (bishops)
            attacks |= bishopAttacks(pop_lsb(bishops), occupied);

        Bitboard rooks = colorBB[color] & (pieceBB[ROOK] | pieceBB[PRO_ROOK]);
        while (rooks)
            attacks |= rookAttacks(pop_lsb(rooks), occupied);

        Bitboard pro_bishops = colorBB[color] & pieceBB[PRO_BISHOP];
        if (pro_bishops)
            attacks |= kingAttacks(pro_bishops);

        Bitboard pro_rooks = colorBB[color] & pieceBB[PRO_ROOK];
        if (pro_rooks)
            attacks |= kingAttacks(pro_rooks);

        return attacks;
    }

    bool isPseudoLegal(Move m)
    {
        if (m.from == -1)
        {
            if (hand[sideToMove][m.drop_type] == 0)
                return false;
            Bitboard toBB = (Bitboard)1 << m.to;
            if ((colorBB[BLACK] | colorBB[WHITE]) & toBB)
                return false;

            int y = m.to / 9;
            if (m.drop_type == PAWN)
            {
                int f = m.to % 9;
                if (colorBB[sideToMove] & pieceBB[PAWN] & FILE_MASKS[f])
                    return false; // Nifu
                if (sideToMove == BLACK && y == 0)
                    return false;
                if (sideToMove == WHITE && y == 8)
                    return false;
            }
            else if (m.drop_type == LANCE)
            {
                if (sideToMove == BLACK && y == 0)
                    return false;
                if (sideToMove == WHITE && y == 8)
                    return false;
            }
            else if (m.drop_type == KNIGHT)
            {
                if (sideToMove == BLACK && y <= 1)
                    return false;
                if (sideToMove == WHITE && y >= 7)
                    return false;
            }
            return true;
        }

        Bitboard fromBB = (Bitboard)1 << m.from;
        Bitboard toBB = (Bitboard)1 << m.to;
        if (!(colorBB[sideToMove] & fromBB))
            return false;
        if (colorBB[sideToMove] & toBB)
            return false;

        PType pt = PAWN;
        for (int i = 0; i < PTYPE_MAX; ++i)
        {
            if (pieceBB[i] & fromBB)
            {
                pt = (PType)i;
                break;
            }
        }

        Bitboard attacks = 0;
        Bitboard occ = (colorBB[BLACK] | colorBB[WHITE]);
        if (pt == PAWN)
            attacks = (sideToMove == BLACK) ? pawnAttacksB(fromBB) : pawnAttacksW(fromBB);
        else if (pt == LANCE)
            attacks = (sideToMove == BLACK) ? lanceAttacksB(m.from, occ) : lanceAttacksW(m.from, occ);
        else if (pt == KNIGHT)
            attacks = (sideToMove == BLACK) ? knightAttacksB(fromBB) : knightAttacksW(fromBB);
        else if (pt == SILVER)
            attacks = (sideToMove == BLACK) ? silverAttacksB(fromBB) : silverAttacksW(fromBB);
        else if (pt == GOLD || pt == PRO_PAWN || pt == PRO_LANCE || pt == PRO_KNIGHT || pt == PRO_SILVER)
            attacks = (sideToMove == BLACK) ? goldAttacksB(fromBB) : goldAttacksW(fromBB);
        else if (pt == KING)
            attacks = kingAttacks(fromBB);
        else if (pt == BISHOP)
            attacks = bishopAttacks(m.from, occ);
        else if (pt == ROOK)
            attacks = rookAttacks(m.from, occ);
        else if (pt == PRO_BISHOP)
            attacks = bishopAttacks(m.from, occ) | kingAttacks(fromBB);
        else if (pt == PRO_ROOK)
            attacks = rookAttacks(m.from, occ) | kingAttacks(fromBB);

        if (!(attacks & toBB))
            return false;

        if (m.promote)
        {
            if (pt == KING || pt == GOLD || pt >= PRO_PAWN)
                return false;
            bool canPromote = false;
            if (sideToMove == BLACK && (m.from / 9 <= 2 || m.to / 9 <= 2))
                canPromote = true;
            if (sideToMove == WHITE && (m.from / 9 >= 6 || m.to / 9 >= 6))
                canPromote = true;
            if (!canPromote)
                return false;
        }
        else
        {
            int to_y = m.to / 9;
            if (pt == PAWN || pt == LANCE)
            {
                if (sideToMove == BLACK && to_y == 0)
                    return false;
                if (sideToMove == WHITE && to_y == 8)
                    return false;
            }
            else if (pt == KNIGHT)
            {
                if (sideToMove == BLACK && to_y <= 1)
                    return false;
                if (sideToMove == WHITE && to_y >= 7)
                    return false;
            }
        }
        return true;
    }

    void makeMove(Move m)
    {
        if (m.from == -1)
        {
            hand[sideToMove][m.drop_type]--;
            colorBB[sideToMove] |= ((Bitboard)1 << m.to);
            pieceBB[m.drop_type] |= ((Bitboard)1 << m.to);
        }
        else
        {
            Bitboard fromBB = ((Bitboard)1 << m.from);
            Bitboard toBB = ((Bitboard)1 << m.to);
            colorBB[sideToMove] &= ~fromBB;

            PType pt = PAWN;
            for (int i = 0; i < PTYPE_MAX; ++i)
            {
                if (pieceBB[i] & fromBB)
                {
                    pt = (PType)i;
                    pieceBB[i] &= ~fromBB;
                    break;
                }
            }

            if (colorBB[1 - sideToMove] & toBB)
            {
                colorBB[1 - sideToMove] &= ~toBB;
                PType capPt = PAWN;
                for (int i = 0; i < PTYPE_MAX; ++i)
                {
                    if (pieceBB[i] & toBB)
                    {
                        capPt = (PType)i;
                        pieceBB[i] &= ~toBB;
                        break;
                    }
                }
                if (capPt == PRO_PAWN)
                    capPt = PAWN;
                else if (capPt == PRO_LANCE)
                    capPt = LANCE;
                else if (capPt == PRO_KNIGHT)
                    capPt = KNIGHT;
                else if (capPt == PRO_SILVER)
                    capPt = SILVER;
                else if (capPt == PRO_BISHOP)
                    capPt = BISHOP;
                else if (capPt == PRO_ROOK)
                    capPt = ROOK;

                if (capPt != KING)
                    hand[sideToMove][capPt]++;
            }

            colorBB[sideToMove] |= toBB;
            if (m.promote)
            {
                if (pt == PAWN)
                    pt = PRO_PAWN;
                else if (pt == LANCE)
                    pt = PRO_LANCE;
                else if (pt == KNIGHT)
                    pt = PRO_KNIGHT;
                else if (pt == SILVER)
                    pt = PRO_SILVER;
                else if (pt == BISHOP)
                    pt = PRO_BISHOP;
                else if (pt == ROOK)
                    pt = PRO_ROOK;
            }
            pieceBB[pt] |= toBB;
        }
        sideToMove = Color(1 - sideToMove);
    }

    bool isKingAttackedAfter(Move m)
    {
        Board nextBoard = *this;
        nextBoard.makeMove(m);
        Color nextOpponent = nextBoard.sideToMove;
        Bitboard oppAttacks = nextBoard.getAttacks(nextOpponent, nextBoard.colorBB[0] | nextBoard.colorBB[1]);
        Bitboard myKing = nextBoard.colorBB[this->sideToMove] & nextBoard.pieceBB[KING];
        return (oppAttacks & myKing) != 0;
    }

    std::string moveToString(const Move &m) const
    {
        if (m.from == -1)
        {
            char p;
            if (m.drop_type == PAWN)
                p = 'P';
            else if (m.drop_type == LANCE)
                p = 'L';
            else if (m.drop_type == KNIGHT)
                p = 'N';
            else if (m.drop_type == SILVER)
                p = 'S';
            else if (m.drop_type == GOLD)
                p = 'G';
            else if (m.drop_type == BISHOP)
                p = 'B';
            else if (m.drop_type == ROOK)
                p = 'R';
            else
                p = '?';
            int f = 9 - (m.to % 9);
            char r = 'a' + (m.to / 9);
            return std::string({p, '*', (char)('0' + f), r});
        }
        else
        {
            int f_from = 9 - (m.from % 9);
            char r_from = 'a' + (m.from / 9);
            int f_to = 9 - (m.to % 9);
            char r_to = 'a' + (m.to / 9);
            std::string res = "";
            res += (char)('0' + f_from);
            res += r_from;
            res += (char)('0' + f_to);
            res += r_to;
            if (m.promote)
                res += '+';
            return res;
        }
    }

    void generatePseudoLegalMoves(std::vector<Move> &moves)
    {
        Bitboard myBB = colorBB[sideToMove];
        Bitboard occ = colorBB[BLACK] | colorBB[WHITE];
        for (int i = 0; i < PTYPE_MAX; ++i)
        {
            Bitboard pcs = myBB & pieceBB[i];
            while (pcs)
            {
                int from = pop_lsb(pcs);
                Bitboard attacks = 0;
                Bitboard fromBB = (Bitboard)1 << from;
                if (i == PAWN)
                    attacks = (sideToMove == BLACK) ? pawnAttacksB(fromBB) : pawnAttacksW(fromBB);
                else if (i == LANCE)
                    attacks = (sideToMove == BLACK) ? lanceAttacksB(from, occ) : lanceAttacksW(from, occ);
                else if (i == KNIGHT)
                    attacks = (sideToMove == BLACK) ? knightAttacksB(fromBB) : knightAttacksW(fromBB);
                else if (i == SILVER)
                    attacks = (sideToMove == BLACK) ? silverAttacksB(fromBB) : silverAttacksW(fromBB);
                else if (i == GOLD || i == PRO_PAWN || i == PRO_LANCE || i == PRO_KNIGHT || i == PRO_SILVER)
                    attacks = (sideToMove == BLACK) ? goldAttacksB(fromBB) : goldAttacksW(fromBB);
                else if (i == KING)
                    attacks = kingAttacks(fromBB);
                else if (i == BISHOP)
                    attacks = bishopAttacks(from, occ);
                else if (i == PRO_BISHOP)
                    attacks = bishopAttacks(from, occ) | kingAttacks(fromBB);
                else if (i == ROOK)
                    attacks = rookAttacks(from, occ);
                else if (i == PRO_ROOK)
                    attacks = rookAttacks(from, occ) | kingAttacks(fromBB);

                attacks &= ~myBB;
                while (attacks)
                {
                    int to = pop_lsb(attacks);
                    bool canPromote = false;
                    bool mustPromote = false;
                    if (i != KING && i != GOLD && i < PRO_PAWN)
                    {
                        if (sideToMove == BLACK && (from / 9 <= 2 || to / 9 <= 2))
                            canPromote = true;
                        if (sideToMove == WHITE && (from / 9 >= 6 || to / 9 >= 6))
                            canPromote = true;
                    }
                    if (canPromote)
                    {
                        int to_y = to / 9;
                        if (i == PAWN || i == LANCE)
                        {
                            if (sideToMove == BLACK && to_y == 0)
                                mustPromote = true;
                            if (sideToMove == WHITE && to_y == 8)
                                mustPromote = true;
                        }
                        else if (i == KNIGHT)
                        {
                            if (sideToMove == BLACK && to_y <= 1)
                                mustPromote = true;
                            if (sideToMove == WHITE && to_y >= 7)
                                mustPromote = true;
                        }
                    }

                    if (canPromote)
                    {
                        moves.push_back({from, to, PAWN, true});
                        if (!mustPromote)
                            moves.push_back({from, to, PAWN, false});
                    }
                    else
                    {
                        moves.push_back({from, to, PAWN, false});
                    }
                }
            }
        }
        Bitboard full_mask = ((Bitboard)1 << 81) - 1;
        for (int pt = PAWN; pt <= ROOK; ++pt)
        {
            if (pt != PRO_PAWN && pt != PRO_LANCE && pt != PRO_KNIGHT && pt != PRO_SILVER && pt != GOLD && pt != PRO_BISHOP && pt != PRO_ROOK && pt != KING)
            {
                if (hand[sideToMove][pt] > 0)
                {
                    Bitboard empty = (~occ) & full_mask;
                    if (pt == PAWN)
                    {
                        for (int f = 0; f < 9; f++)
                        {
                            if (myBB & pieceBB[PAWN] & FILE_MASKS[f])
                            {
                                empty &= ~FILE_MASKS[f];
                            }
                        }
                    }
                    if (pt == PAWN || pt == LANCE)
                    {
                        int last_rank = (sideToMove == BLACK) ? 0 : 8;
                        empty &= ~RANK_MASKS[last_rank];
                    }
                    else if (pt == KNIGHT)
                    {
                        if (sideToMove == BLACK)
                        {
                            empty &= ~RANK_MASKS[0];
                            empty &= ~RANK_MASKS[1];
                        }
                        else
                        {
                            empty &= ~RANK_MASKS[7];
                            empty &= ~RANK_MASKS[8];
                        }
                    }
                    while (empty)
                    {
                        int to = pop_lsb(empty);
                        moves.push_back({-1, to, (PType)pt, false});
                    }
                }
            }
        }
    }

    void generateLegalMoves(std::vector<Move> &legalMoves)
    {
        std::vector<Move> pseudoMoves;
        generatePseudoLegalMoves(pseudoMoves);
        for (const Move &m : pseudoMoves)
        {
            if (isPseudoLegal(m) && !isKingAttackedAfter(m))
            {
                legalMoves.push_back(m);
            }
        }
    }
};
