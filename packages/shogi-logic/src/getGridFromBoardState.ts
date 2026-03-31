import { BoardState, Color, PType, Square } from "./types";

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

    Object.entries(state.hands).forEach(([colorStr, hand]) => {
        const color = Number(colorStr) as Color;
        const side = color === Color.BLACK ? "sente" : "gote";

        Object.entries(hand).forEach(([typeStr, count]) => {
            const pieceType = Number(typeStr) as PType;
            if (count <= 0) return;

            const typeName = PType[pieceType];
            
            const baseId = `${side}-${typeName}-hand`;

            // 持ち駒も1枚ずつ個別のIDを振る場合
            for (let i = 0; i < count; i++) {
                counts[baseId] = (counts[baseId] || 0) + 1;
                const uniqueId = `${baseId}-${counts[baseId]}`;

                gridMap[uniqueId] = { row: -1, col: -1 }; 
            }
        });
    });

    return gridMap;
};