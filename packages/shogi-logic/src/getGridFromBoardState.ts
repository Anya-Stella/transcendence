import { BoardState, Color, PieceType, Square } from "./types";

export const getGridFromBoardState = (state: BoardState): Record<string, Square> => {
    const gridMap: Record<string, Square> = {};
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const piece = state.board[row][col];
            if (piece) {
                const id = generatePieceId(piece.color, piece.pieceType as PieceType, gridMap);
                gridMap[id] = { row, col };
            }
        }
    }
    return gridMap;
};

const generatePieceId = (color: Color, type: PieceType, existing: Record<string, any>): string => {
    const prefix = color === Color.BLACK ? "sente" : "gote";
    const typeStr = getPieceTypeKey(type);
    const baseId = `${prefix}-${typeStr}`;
    if (!existing[baseId]) return baseId;
    let i = 1;
    while (existing[`${baseId}-${i}`])
        i++;
    return `${baseId}-${i}`;
};

const getPieceTypeKey = (type: PieceType): string => {
    switch (type) {
        case PieceType.KING: return "ou";
        case PieceType.GOLD: return "kin";
        case PieceType.SILVER: return "gin";
        case PieceType.BISHOP: return "kaku";
        case PieceType.ROOK: return "hisya";
        case PieceType.PAWN: return "fu";
        default: return "unknown";
    }
};