import { useState, useCallback, useEffect } from "react";
import { 
    Color, 
    BoardState, 
    applyMove, 
    Move, 
    UNPROMOTE_MAP,
    gridToWorld, 
    worldToGrid, 
    checkIsHandPos,
    PIECE_INITIAL_GRID,
    SENTE_HAND_COORDS,
    GOTE_HAND_COORDS,
    PieceType
} from "@torassen/shogi-logic";

interface UseShogiBoard3DProps {
    initialState: BoardState;
    isFlipped: boolean;
    onTurnChange?: (turn: Color) => void;
    onBoardMove?: (move: Move) => void;
}

export function useShogiBoard3D({ 
    initialState, 
    isFlipped, 
    onTurnChange, 
    onBoardMove 
}: UseShogiBoard3DProps) {
    const [boardState, setBoardState] = useState<BoardState>(initialState);
    const [piecePositions, setPiecePositions] = useState<Record<string, [number, number, number]>>({});
    
    const [pieceOwners, setPieceOwners] = useState<Record<string, Color>>(() => {
        const initial: Record<string, Color> = {};
        Object.keys(PIECE_INITIAL_GRID).forEach(id => {
            initial[id] = id.startsWith("sente-") ? Color.BLACK : Color.WHITE;
        });
        return initial;
    });

    const [piecePromotions, setPiecePromotions] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        Object.keys(PIECE_INITIAL_GRID).forEach(id => { initial[id] = false; });
        return initial;
    });

    // --- 内部ロジック ---
    const applyMoveTo3D = useCallback((id: string, move: Move) => {
        const toGrid = move.to;
        const capturedPiece = move.type === "move" ? boardState.board[toGrid.row][toGrid.col] : null;
        const nextState = applyMove(boardState, move);

        // 所有者と成り状態の更新
        if (capturedPiece) {
            const capturedId = Object.keys(PIECE_INITIAL_GRID).find(pid => {
                if (pid === id) return false;
                const pPos = piecePositions[pid] || gridToWorld(PIECE_INITIAL_GRID[pid].row, PIECE_INITIAL_GRID[pid].col, isFlipped);
                if (checkIsHandPos(pPos)) return false;
                const pg = worldToGrid(pPos[0], pPos[2], isFlipped);
                return pg && pg.row === toGrid.row && pg.col === toGrid.col;
            });
            if (capturedId) {
                setPieceOwners(prev => ({ ...prev, [capturedId]: boardState.sideToMove }));
                setPiecePromotions(prev => ({ ...prev, [capturedId]: false }));
            }
        }

        if (move.type === "move" && move.promote) {
            setPiecePromotions(prev => ({ ...prev, [id]: true }));
        }

        setPiecePositions(prev => {
            const nextPosMap = { ...prev };
            nextPosMap[id] = gridToWorld(toGrid.row, toGrid.col, isFlipped);

            if (capturedPiece) {
                const capturedId = Object.keys(PIECE_INITIAL_GRID).find(pid => {
                    if (pid === id) return false;
                    const pPos = prev[pid] || gridToWorld(PIECE_INITIAL_GRID[pid].row, PIECE_INITIAL_GRID[pid].col, isFlipped);
                    if (checkIsHandPos(pPos)) return false;
                    const pg = worldToGrid(pPos[0], pPos[2], isFlipped);
                    return pg && pg.row === toGrid.row && pg.col === toGrid.col;
                });

                if (capturedId) {
                    const winnerColor = boardState.sideToMove;
                    const coordsMap = (winnerColor === Color.BLACK ? SENTE_HAND_COORDS : GOTE_HAND_COORDS) as Record<PieceType, [number, number, number]>;
                    const baseType = (UNPROMOTE_MAP[capturedPiece.pieceType] ?? capturedPiece.pieceType) as PieceType;
                    nextPosMap[capturedId] = coordsMap[baseType] || [0, 0, 0];
                }
            }
            return nextPosMap;
        });

        setBoardState(nextState);
    }, [boardState, piecePositions, isFlipped]);

    // --- 外部公開用 ---
    const executeMove = useCallback((id: string, move: Move) => {
        applyMoveTo3D(id, move);
        const nextSide = (boardState.sideToMove === Color.BLACK) ? Color.WHITE : Color.BLACK;
        onTurnChange?.(nextSide);
        onBoardMove?.(move);
    }, [boardState, applyMoveTo3D, onTurnChange, onBoardMove]);

    return {
        boardState,
        piecePositions,
        pieceOwners,
        piecePromotions,
        executeMove,
        setBoardState,
        setPiecePositions,
        setPiecePromotions,
        setPieceOwners
    };
}