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
    bool is_legal = board.isPseudoLegal(m) && !board.isKingAttackedAfter(m) && !board.isUchifuzume(m);
    if (is_legal == expected_legal) {
        std::cout << "[OK] " << sfen << " | " << move_str << " -> " << (expected_legal ? "legal" : "illegal") << std::endl;
    } else {
        std::cout << "[FAIL] " << sfen << " | " << move_str << " expected " << (expected_legal ? "legal" : "illegal") << " but got " << (is_legal ? "legal" : "illegal") << std::endl;
    }
}

void run_all_tests() {
    std::cout << "--- Drop (Uchigoma) Tests ---" << std::endl;
    // 持ち駒がある状態で打てるか (5dに歩があるので4cに打つ)
    run_test("rbsgk/4p/5/P4/KGSBR b P 1", "P*4c", true);
    // 持ち駒がない状態で打てないか
    run_test("rbsgk/4p/5/P4/KGSBR b - 1", "P*4c", false);
    // 持ち駒にない種類の駒を打てないか
    run_test("rbsgk/4p/5/P4/KGSBR b P 1", "S*4c", false);
    // 既に駒がある場所に打てないか (5dには歩がある)
    run_test("rbsgk/4p/5/P4/KGSBR b P 1", "P*5d", false); 
    // 二歩のチェック (先手は5dにあるので5cに打つと二歩)
    run_test("rbsgk/4p/5/P4/KGSBR b P 1", "P*5c", false);
    // 後手の二歩のチェック (後手は1eに歩があるので1dに打つと二歩)
    run_test("rbsgk/4p/5/P4/KGSBR w p 1", "P*1d", false);
    // 行き所のない歩 (先手は1段目(a)に打てない)
    run_test("rbsgk/4p/5/P4/KGSBR b P 1", "P*4a", false);
    // 行き所のない歩 (後手は5段目(e)に打てない)
    run_test("rbsgk/4p/5/P4/KGSBR w p 1", "P*4e", false);
    
    // 王手回避のチェック (打って防ぐケース: 5aの角から1eの玉への利きを4bに歩を打って防ぐ)
    run_test("b4/5/5/5/4K b P 1", "P*4b", true);
    // 防げない手 (関係ない場所に打つ)
    run_test("b4/5/5/5/4K b P 1", "P*2d", true); // Wait, 2d is on the diagonal, so it does block!
    run_test("b4/5/5/5/4K b P 1", "P*3c", true); // Also blocks
    run_test("b4/5/5/5/4K b P 1", "P*5e", false); // Does not block, illegal

    // 打ち歩詰めのチェック
    run_test("k4/1p3/5/5/4K w p 1", "P*1a", false); // 1a is uchifuzume and thus illegal
    run_test("k4/1p3/5/5/4K b P 1", "P*2b", true);  // 2b is normal pawn drop, not mate
    
    std::cout << "-----------------------------" << std::endl;
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

    if (board.isUchifuzume(m)) {
        std::cout << "illegal (uchifuzume)" << std::endl;
        return 0;
    }

    std::cout << "legal" << std::endl;
    return 0;
}
