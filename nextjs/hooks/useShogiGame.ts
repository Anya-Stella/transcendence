import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation"; // router用
import { 
    PieceData, 
    INITIAL_BOARD, 
    INITIAL_HAND, 
    HandPieces, 
    DEMOTE_MAP, 
    PROMOTE_MAP 
} from "@/utils/shogiConstants";
import { getLegalMovesForPiece, getLegalDrops } from "@/lib/shogi/board";
import { KANJI_TO_PTYPE, PTYPE_TO_KANJI_SENTE } from "@/lib/shogi/board";
import { type PieceInfo, type LegalTarget } from "@/lib/shogi/types";

function deepCopyBoard(board: PieceData[][]): PieceData[][] {
    return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function useShogiGame(socket, roomId, mySide, wsStatus) {
    // 部品を呼び出す
    const { board, movePiece, dropPiece } = useBoard(INITIAL_BOARD);
    const { senteHand, goteHand, addCapturedPiece, removeHandPiece } = useHands();
    
    // UI用の細かい状態
    const [selected, setSelected] = useState(null);
    const [turn, setTurn] = useState("sente");

    // 合法手の計算 (useMemoなどはそのまま)
    const legalTargets = useMemo(() => { ... }, [board, turn, ...]);

    // 実際の移動アクション（通信と状態更新を紐づける）
    const handleMoveAction = useCallback((from, to, promote) => {
        movePiece(from, to, promote);
        setTurn(t => t === "sente" ? "gote" : "sente");
        socket.emit("move", { from, to, promote });
    }, [movePiece, socket]);

    return {
        board, turn, senteHand, goteHand,
        handleCellClick, // これは統合ロジックとして残す
        // ...その他
    };
}