#include "board.hpp"
#include <iostream>

void run_test(const std::string& sfen, const std::string& move_str, bool expected_legal) {
    Board board;
    if (!board.set_sfen(sfen)) {
        std::cout << "Test failed: Invalid SFEN " << sfen << std::endl;
        return;
    }
    Move m;
    if (!parseMove(move_str, m)) {
        std::cout << "Test failed: Invalid Move " << move_str << std::endl;
        return;
    }
    bool is_legal = board.isPseudoLegal(m) && !board.isKingAttackedAfter(m);
    if (is_legal == expected_legal) {
        std::cout << "[OK] " << sfen << " | " << move_str << " -> " << (expected_legal ? "legal" : "illegal") << std::endl;
    } else {
        std::cout << "[FAIL] " << sfen << " | " << move_str << " expected " << (expected_legal ? "legal" : "illegal") << " but got " << (is_legal ? "legal" : "illegal") << std::endl;
    }
}

void run_all_tests() {
    std::cout << "--- 99 Shogi Tests ---" << std::endl;
    run_test("lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1", "7g7f", true);
    run_test("lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1", "7c7d", false);
    run_test("lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b P 1", "P*7e", false);
    run_test("lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPP1PPPP/1B5R1/LNSGKGSNL b P 1", "P*5e", true);
    run_test("lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPP1PPPP/1B5R1/LNSGKGSNL b P 1", "P*5a", false);
    run_test("lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1", "7g7f+", false);
    run_test("lnsgk2nl/1r4gb1/ppppppppp/9/9/4B4/PPPPPPPPP/7R1/LNSGKGSNL b - 1", "5i5h", true);
    std::cout << "----------------------" << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 3) {
        if (argc == 2 && std::string(argv[1]) == "test") {
            run_all_tests();
            return 0;
        }
        std::cerr << "Usage: " << argv[0] << " \"<sfen>\" \"<move>\"" << std::endl;
        std::cerr << "       " << argv[0] << " test" << std::endl;
        return 1;
    }

    std::string sfen = argv[1];
    std::string move_str = argv[2];

    Board board;
    if (!board.set_sfen(sfen)) {
        std::cout << "illegal (invalid sfen)" << std::endl;
        return 0;
    }

    Move m;
    if (!parseMove(move_str, m)) {
        std::cout << "illegal (invalid move format)" << std::endl;
        return 0;
    }

    if (!board.isPseudoLegal(m)) {
        std::cout << "illegal (pseudo-legal check failed)" << std::endl;
        return 0;
    }

    if (board.isKingAttackedAfter(m)) {
        std::cout << "illegal (king is attacked after move)" << std::endl;
        return 0;
    }

    std::cout << "legal" << std::endl;
    return 0;
}
