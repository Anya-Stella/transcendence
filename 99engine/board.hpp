#pragma once
#include "types.hpp"
#include "bitboard.hpp"
#include <vector>
#include <string>

bool parseMove(std::string str, Move &m);

class Board
{
public:
    Bitboard colorBB[2];
    Bitboard pieceBB[15];
    int hand[2][15];
    Color sideToMove;

    Board();

    bool set_sfen(const std::string &sfen);
    Bitboard getAttacks(Color color, Bitboard occupied);
    bool isPseudoLegal(Move m);
    void makeMove(Move m);
    bool isKingAttackedAfter(Move m);
    std::string moveToString(const Move &m) const;
    void generatePseudoLegalMoves(std::vector<Move> &moves);
    void generateLegalMoves(std::vector<Move> &legalMoves);
};
