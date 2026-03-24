#include "board.hpp"
#include <climits>
#include <iostream>
#include <algorithm>

const int INF = 1000000;

int pieceValue(PType pt)
{
    switch (pt)
    {
    case PAWN:
        return 107;
    case SILVER:
        return 810;
    case GOLD:
        return 907;
    case BISHOP:
        return 1291;
    case ROOK:
        return 1670;
    case PRO_PAWN:
        return 895;
    case PRO_SILVER:
        return 993;
    case PRO_BISHOP:
        return 1985;
    case PRO_ROOK:
        return 2408;
    case KING:
        return 100000;
    default:
        return 0;
    }
}

int handPeiceValue(PType pt)
{
    switch (pt)
    {
    case PAWN:
        return 152;
    case SILVER:
        return 1100;
    case GOLD:
        return 1260;
    case BISHOP:
        return 1464;
    case ROOK:
        return 1998;
    default:
        return 0;
    }
}

int evaluate(const Board &board)
{
    int score = 0;
    for (int i = 0; i < PTYPE_MAX; ++i)
    {
        if (i == KING)
            continue;
        int val = pieceValue((PType)i);
        Bitboard b_pcs = board.colorBB[BLACK] & board.pieceBB[i];
        Bitboard w_pcs = board.colorBB[WHITE] & board.pieceBB[i];
        int b_count = 0;
        while (b_pcs)
        {
            pop_lsb(b_pcs);
            b_count++;
        }
        int w_count = 0;
        while (w_pcs)
        {
            pop_lsb(w_pcs);
            w_count++;
        }

        score += val * (b_count - w_count);
    }

    for (int pt = PAWN; pt <= ROOK; ++pt)
    {
        int val = handPeiceValue((PType)pt);
        score += val * board.hand[BLACK][pt];
        score -= val * board.hand[WHITE][pt];
    }

    return board.sideToMove == BLACK ? score : -score;
}

int alphaBeta(Board &board, int depth, int alpha, int beta)
{
    if (depth == 0)
    {
        return evaluate(board);
    }

    std::vector<Move> moves;
    board.generateLegalMoves(moves);
    if (moves.empty())
    {
        return -INF; // Lost
    }

    for (Move m : moves)
    {
        Board nextBoard = board;
        nextBoard.makeMove(m);
        int score = -alphaBeta(nextBoard, depth - 1, -beta, -alpha);
        if (score >= beta)
            return beta;
        if (score > alpha)
            alpha = score;
    }
    return alpha;
}

Move findBestMove(Board &board, int depth)
{
    std::vector<Move> moves;
    board.generateLegalMoves(moves);

    Move best_move;
    best_move.from = -1;
    best_move.to = -1;
    if (moves.empty())
        return best_move;

    best_move = moves[0];
    int best_score = -INF * 2;
    int alpha = -INF * 2;
    int beta = INF * 2;

    for (Move m : moves)
    {
        Board nextBoard = board;
        nextBoard.makeMove(m);
        int score = -alphaBeta(nextBoard, depth - 1, -beta, -alpha);
        if (score > best_score)
        {
            best_score = score;
            best_move = m;
        }
        if (score > alpha)
            alpha = score;
    }
    return best_move;
}

int main(int argc, char *argv[])
{
    if (argc < 2)
    {
        std::cerr << "Usage: " << argv[0] << " \"<sfen>\" [depth]" << std::endl;
        return 1;
    }

    std::string sfen = argv[1];
    int depth = 4;
    if (argc >= 3)
    {
        depth = std::stoi(argv[2]);
    }

    Board board;
    if (!board.set_sfen(sfen))
    {
        std::cerr << "Engine error: invalid sfen" << std::endl;
        return 1;
    }

    Move best = findBestMove(board, depth);
    if (best.to == -1)
    {
        std::cout << "bestmove resign" << std::endl;
    }
    else
    {
        std::cout << "bestmove " << board.moveToString(best) << std::endl;
    }

    return 0;
}
