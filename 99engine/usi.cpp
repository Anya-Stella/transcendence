#include "board.hpp"
#include <climits>
#include <iostream>
#include <algorithm>
#include <sstream>

const int INF = 1000000;

int pieceValue(PType pt) {
    switch(pt) {
        case PAWN: return 100;
        case LANCE: return 300;
        case KNIGHT: return 300;
        case SILVER: return 400;
        case GOLD: return 450;
        case BISHOP: return 600;
        case ROOK: return 700;
        case PRO_PAWN: return 450;
        case PRO_LANCE: return 450;
        case PRO_KNIGHT: return 450;
        case PRO_SILVER: return 450;
        case PRO_BISHOP: return 800;
        case PRO_ROOK: return 900;
        case KING: return 10000;
        default: return 0;
    }
}

int evaluate(const Board& board) {
    int score = 0;
    for (int i = 0; i < PTYPE_MAX; ++i) {
        if (i == KING) continue;
        int val = pieceValue((PType)i);
        Bitboard b_pcs = board.colorBB[BLACK] & board.pieceBB[i];
        Bitboard w_pcs = board.colorBB[WHITE] & board.pieceBB[i];
        int b_count = 0;
        while (b_pcs) { pop_lsb(b_pcs); b_count++; }
        int w_count = 0;
        while (w_pcs) { pop_lsb(w_pcs); w_count++; }
        score += val * (b_count - w_count);
    }
    for (int pt = PAWN; pt <= ROOK; ++pt) {
        int val = pieceValue((PType)pt);
        score += val * board.hand[BLACK][pt];
        score -= val * board.hand[WHITE][pt];
    }
    return board.sideToMove == BLACK ? score : -score;
}

int alphaBeta(Board& board, int depth, int alpha, int beta) {
    if (depth == 0) return evaluate(board);
    std::vector<Move> moves;
    board.generateLegalMoves(moves);
    if (moves.empty()) return -INF;
    for (Move m : moves) {
        Board nextBoard = board;
        nextBoard.makeMove(m);
        int score = -alphaBeta(nextBoard, depth - 1, -beta, -alpha);
        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
    }
    return alpha;
}

Move findBestMove(Board& board, int depth) {
    std::vector<Move> moves;
    board.generateLegalMoves(moves);
    Move best_move;
    best_move.from = -1;
    best_move.to = -1;
    if (moves.empty()) return best_move;
    best_move = moves[0];
    int best_score = -INF * 2;
    int alpha = -INF * 2;
    int beta = INF * 2;
    for (Move m : moves) {
        Board nextBoard = board;
        nextBoard.makeMove(m);
        int score = -alphaBeta(nextBoard, depth - 1, -beta, -alpha);
        if (score > best_score) {
            best_score = score;
            best_move = m;
        }
        if (score > alpha) alpha = score;
    }
    return best_move;
}

void usiLoop() {
    std::string line;
    Board board;
    board.set_sfen("lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1");

    while (std::getline(std::cin, line)) {
        std::stringstream ss(line);
        std::string command;
        ss >> command;

        if (command == "usi") {
            std::cout << "id name 99engine" << std::endl;
            std::cout << "id author Antigravity" << std::endl;
            std::cout << "usiok" << std::endl;
        } else if (command == "isready") {
            std::cout << "readyok" << std::endl;
        } else if (command == "usinewgame") {
            // 新規対局
        } else if (command == "position") {
            std::string pos_type;
            ss >> pos_type;
            if (pos_type == "startpos") {
                board.set_sfen("lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1");
                std::string moves_str;
                ss >> moves_str;
                if (moves_str == "moves") {
                    std::string m_str;
                    while (ss >> m_str) {
                        Move m;
                        if (parseMove(m_str, m))
                            board.makeMove(m);
                    }
                }
            } else if (pos_type == "sfen") {
                std::string board_sfen, color_sfen, hand_sfen;
                ss >> board_sfen >> color_sfen >> hand_sfen;
                board.set_sfen(board_sfen + " " + color_sfen + " " + hand_sfen);
                std::string m_str;
                while (ss >> m_str) {
                    if (m_str == "moves") continue;
                    Move m;
                    if (parseMove(m_str, m))
                        board.makeMove(m);
                }
            }
        } else if (command == "go") {
            int depth = 4;
            Move best = findBestMove(board, depth);
            if (best.to == -1) {
                std::cout << "bestmove resign" << std::endl;
            } else {
                std::cout << "bestmove " << board.moveToString(best) << std::endl;
            }
        } else if (command == "quit") {
            break;
        }
    }
}

int main() {
    std::setvbuf(stdout, NULL, _IONBF, 0);
    std::setvbuf(stdin, NULL, _IONBF, 0);
    usiLoop();
    return 0;
}
