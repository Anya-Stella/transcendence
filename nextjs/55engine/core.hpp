#pragma once

#include <iostream>
#include <string>
#include <sstream>
#include <vector>
#include <cctype>
#include <cstdint>

#if defined(_MSC_VER)
#include <intrin.h>
#endif

typedef uint32_t Bitboard;

enum Color
{
    BLACK = 0,
    WHITE = 1,
    NO_COLOR = 2
};
enum PType
{
    PAWN = 0,
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

const Bitboard FILE_5 = 0x00108421;
const Bitboard FILE_4 = 0x00210842;
const Bitboard FILE_3 = 0x00421084;
const Bitboard FILE_2 = 0x00842108;
const Bitboard FILE_1 = 0x01084210;
const Bitboard NOT_FILE_1 = ~FILE_1;
const Bitboard NOT_FILE_5 = ~FILE_5;

// Basic bitwise operations for LSB
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

Bitboard shiftUp(Bitboard b) { return b >> 5; }
Bitboard shiftDown(Bitboard b) { return (b << 5) & 0x01FFFFFF; }
Bitboard shiftLeft(Bitboard b) { return (b & NOT_FILE_5) >> 1; }
Bitboard shiftRight(Bitboard b) { return (b & NOT_FILE_1) << 1; }

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

struct Move
{
    int from; // -1 for drop
    int to;
    PType drop_type;
    bool promote;
};

// SFEN Move String parsing (e.g. 5e5d, 1b1a+, P*1a)
bool parseMove(std::string str, Move &m)
{
    if (str.length() >= 4 && str[1] == '*')
    {
        m.from = -1;
        char p = std::toupper(str[0]);
        if (p == 'P')
            m.drop_type = PAWN;
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
        int x = 5 - f;
        int y = (r >= 'a' && r <= 'e') ? (r - 'a') : (r - '1');
        if (x < 0 || x > 4 || y < 0 || y > 4)
            return false;
        m.to = y * 5 + x;
        m.promote = false;
        return true;
    }
    else if (str.length() >= 4)
    {
        int f_from = str[0] - '0';
        char r_from = str[1];
        int x_from = 5 - f_from;
        int y_from = (r_from >= 'a' && r_from <= 'e') ? (r_from - 'a') : (r_from - '1');
        if (x_from < 0 || x_from > 4 || y_from < 0 || y_from > 4)
            return false;
        m.from = y_from * 5 + x_from;

        int f_to = str[2] - '0';
        char r_to = str[3];
        int x_to = 5 - f_to;
        int y_to = (r_to >= 'a' && r_to <= 'e') ? (r_to - 'a') : (r_to - '1');
        if (x_to < 0 || x_to > 4 || y_to < 0 || y_to > 4)
            return false;
        m.to = y_to * 5 + x_to;

        m.promote = (str.length() == 5 && str[4] == '+');
        return true;
    }
    return false;
}

class Board
{
public:
    Bitboard colorBB[2];
    Bitboard pieceBB[10];
    int hand[2][10];
    Color sideToMove;

    bool set_sfen(const std::string &sfen)
    {
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
            else if (c >= '1' && c <= '5')
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

                int sq = y * 5 + x;
                colorBB[color] |= (1U << sq);
                pieceBB[pt] |= (1U << sq);
                x++;
                promote_next = false;
            }
        }

        if (hand_str != "-")
        {
            int count = 1;
            for (char c : hand_str)
            {
                if (c >= '1' && c <= '9')
                {
                    count = c - '0';
                }
                else
                {
                    auto color = std::islower(c) ? WHITE : BLACK;
                    char target = std::tolower(c);
                    PType pt = PAWN;
                    if (target == 'p')
                        pt = PAWN;
                    else if (target == 's')
                        pt = SILVER;
                    else if (target == 'g')
                        pt = GOLD;
                    else if (target == 'b')
                        pt = BISHOP;
                    else if (target == 'r')
                        pt = ROOK;
                    hand[color][pt] += count;
                    count = 1;
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

        Bitboard silvers = colorBB[color] & pieceBB[SILVER];
        attacks |= (color == BLACK) ? silverAttacksB(silvers) : silverAttacksW(silvers);

        Bitboard golds = colorBB[color] & (pieceBB[GOLD] | pieceBB[PRO_PAWN] | pieceBB[PRO_SILVER]);
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
            if ((colorBB[BLACK] | colorBB[WHITE]) & (1U << m.to))
                return false;
            if (m.drop_type == PAWN)
            {
                int f = m.to % 5;
                Bitboard file_mask_x = 0;
                for (int y = 0; y < 5; ++y)
                    file_mask_x |= (1U << (y * 5 + f));
                Bitboard my_pawns = colorBB[sideToMove] & pieceBB[PAWN];
                if (my_pawns & file_mask_x)
                    return false; // Nifu

                if (sideToMove == BLACK && m.to / 5 == 0)
                    return false;
                if (sideToMove == WHITE && m.to / 5 == 4)
                    return false;
            }
            return true;
        }

        Bitboard fromBB = 1U << m.from;
        Bitboard toBB = 1U << m.to;
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
        else if (pt == SILVER)
            attacks = (sideToMove == BLACK) ? silverAttacksB(fromBB) : silverAttacksW(fromBB);
        else if (pt == GOLD || pt == PRO_PAWN || pt == PRO_SILVER)
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
            if (sideToMove == BLACK && (m.from / 5 == 0 || m.to / 5 == 0))
                canPromote = true;
            if (sideToMove == WHITE && (m.from / 5 == 4 || m.to / 5 == 4))
                canPromote = true;
            if (!canPromote)
                return false;
        }
        else
        {
            if (pt == PAWN)
            {
                if (sideToMove == BLACK && m.to / 5 == 0)
                    return false;
                if (sideToMove == WHITE && m.to / 5 == 4)
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
            colorBB[sideToMove] |= (1U << m.to);
            pieceBB[m.drop_type] |= (1U << m.to);
        }
        else
        {
            Bitboard fromBB = 1U << m.from;
            Bitboard toBB = 1U << m.to;
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

    bool isUchifuzume(Move m)
    {
        if (m.from != -1 || m.drop_type != PAWN)
            return false;

        Board nextBoard = *this;
        nextBoard.makeMove(m);

        Color opponent = nextBoard.sideToMove;
        Bitboard myColor = Color(1 - opponent);
        Bitboard oppKing = nextBoard.colorBB[opponent] & nextBoard.pieceBB[KING];
        
        if (!oppKing) return false;

        Bitboard myAttacks = nextBoard.getAttacks(Color(myColor), nextBoard.colorBB[BLACK] | nextBoard.colorBB[WHITE]);
        if (!(myAttacks & oppKing))
            return false;

        std::vector<Move> oppMoves;
        nextBoard.generatePseudoLegalMoves(oppMoves);
        for (const Move &resp : oppMoves) {
            if (nextBoard.isPseudoLegal(resp) && !nextBoard.isKingAttackedAfter(resp)) {
                return false;
            }
        }
        return true;
    }

    std::string moveToString(const Move &m) const
    {
        if (m.from == -1)
        {
            char p;
            if (m.drop_type == PAWN)
                p = 'P';
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
            int f = 5 - (m.to % 5);
            char r = 'a' + (m.to / 5);
            return std::string({p, '*', (char)('0' + f), r});
        }
        else
        {
            int f_from = 5 - (m.from % 5);
            char r_from = 'a' + (m.from / 5);
            int f_to = 5 - (m.to % 5);
            char r_to = 'a' + (m.to / 5);
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
                Bitboard fromBB = 1U << from;
                if (i == PAWN)
                    attacks = (sideToMove == BLACK) ? pawnAttacksB(fromBB) : pawnAttacksW(fromBB);
                else if (i == SILVER)
                    attacks = (sideToMove == BLACK) ? silverAttacksB(fromBB) : silverAttacksW(fromBB);
                else if (i == GOLD || i == PRO_PAWN || i == PRO_SILVER)
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
                        if (sideToMove == BLACK && (from / 5 == 0 || to / 5 == 0))
                            canPromote = true;
                        if (sideToMove == WHITE && (from / 5 == 4 || to / 5 == 4))
                            canPromote = true;
                    }
                    if (i == PAWN && canPromote)
                        mustPromote = true;

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
        for (int pt = PAWN; pt <= ROOK; ++pt)
        {
            if (pt != PRO_PAWN && pt != PRO_SILVER && pt != GOLD && pt != PRO_BISHOP && pt != PRO_ROOK && pt != KING)
            {
                if (hand[sideToMove][pt] > 0)
                {
                    Bitboard empty = ~occ;
                    if (pt == PAWN)
                    {
                        for (int f = 0; f < 5; f++)
                        {
                            Bitboard file_mask_x = 0;
                            for (int y = 0; y < 5; ++y)
                                file_mask_x |= (1U << (y * 5 + f));
                            if (myBB & pieceBB[PAWN] & file_mask_x)
                            {
                                empty &= ~file_mask_x;
                            }
                        }
                        int last_rank = (sideToMove == BLACK) ? 0 : 4;
                        Bitboard last_rank_mask = 0;
                        for (int f = 0; f < 5; f++)
                            last_rank_mask |= (1U << (last_rank * 5 + f));
                        empty &= ~last_rank_mask;
                    }
                    empty &= 0x01FFFFFF;
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
            if (isPseudoLegal(m) && !isKingAttackedAfter(m) && !isUchifuzume(m))
            {
                legalMoves.push_back(m);
            }
        }
    }
};
