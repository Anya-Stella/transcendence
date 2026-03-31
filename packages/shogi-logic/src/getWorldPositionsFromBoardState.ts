import { GOTE_HAND_COORDS, SENTE_HAND_COORDS } from "./constants";
import { gridToWorld } from "./grid-world";
import { BoardState, Color, PType, PieceType } from "./types";

export function getWorldPositionsFromBoardState(
    state: BoardState, 
    isFlipped: boolean = false
): Record<string, [number, number, number]> {
    const positions: Record<string, [number, number, number]> = {};
    const counts: Record<string, number> = {};

    state.board.forEach((rowArray, rowIndex) => {
        rowArray.forEach((cell, colIndex) => {
            if (cell) {
                const { color, pieceType } = cell;
                const side = color === Color.BLACK ? "sente" : "gote";
                const typeName = PType[pieceType];

                const baseId = `${side}-${typeName}`;
                counts[baseId] = (counts[baseId] || 0) + 1;
                const uniqueId = `${baseId}-${counts[baseId]}`;

                positions[uniqueId] = gridToWorld(rowIndex, colIndex, isFlipped);
            }
        });
    });

    Object.entries(state.hands).forEach(([colorStr, hand]) => {
        const color = Number(colorStr) as Color;
        const side = color === Color.BLACK ? "sente" : "gote";
        const coordsSource = color === Color.BLACK ? SENTE_HAND_COORDS : GOTE_HAND_COORDS;

        Object.entries(hand).forEach(([typeStr, count]) => {
            const pieceType = Number(typeStr) as PType;
            if (count <= 0) return;

            const baseType = pieceType >= 6 ? (pieceType - 6) : pieceType;
            const typeName = PType[pieceType];
            
            const handPos = coordsSource[baseType as PieceType] || [0, 10, 0];

            const baseHandId = `${side}-${typeName}-hand`;

            for (let i = 0; i < count; i++) {
                counts[baseHandId] = (counts[baseHandId] || 0) + 1;
                const uniqueId = `${baseHandId}-${counts[baseHandId]}`;
                positions[uniqueId] = [...handPos]; 
            }
        });
    });

    return positions;
}