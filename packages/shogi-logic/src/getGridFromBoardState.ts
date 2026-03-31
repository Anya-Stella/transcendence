import { BoardState, Color, PType, Square } from "./types";

/**
 * 盤面状態から各駒のIDをキーとした座標マップを生成する
 */
export const getGridFromBoardState = (state: BoardState): Record<string, Square> => {
    const gridMap: Record<string, Square> = {};
    
    const counts: Record<string, number> = {};

    state.board.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell) {
                const { color, pieceType } = cell;

                const side = color === Color.BLACK ? "sente" : "gote";
                
                const typeName = PType[pieceType];
                
                const baseId = `${side}-${typeName}`;

                counts[baseId] = (counts[baseId] || 0) + 1;
                const uniqueId = `${baseId}-${counts[baseId]}`;

                gridMap[uniqueId] = { row: rowIndex, col: colIndex };
            }
        });
    });

    return gridMap;
};