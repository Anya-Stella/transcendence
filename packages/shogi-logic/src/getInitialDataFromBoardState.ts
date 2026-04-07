import { GOTE_HAND_COORDS, SENTE_HAND_COORDS, UNPROMOTE_MAP } from "./constants";
import { gridToWorld } from "./grid-world";
import { BoardState, Color, PType, PieceType } from "./types";

// まとめて返すための型を定義
export interface InitialBoardData {
    positions: Record<string, [number, number, number]>;
    owners: Record<string, Color>;
    promotions: Record<string, boolean>;
}

export function getInitialDataFromBoardState(
    state: BoardState,
    isFlipped: boolean = false
): InitialBoardData {
    const positions: Record<string, [number, number, number]> = {};
    const owners: Record<string, Color> = {};
    const promotions: Record<string, boolean> = {};
    const counts: Record<string, number> = {};

    // 1. 盤上の駒をスキャン
    state.board.forEach((rowArray, rowIndex) => {
        rowArray.forEach((cell, colIndex) => {
            if (cell) {
                const { color, pieceType } = cell;
                const basePieceType = UNPROMOTE_MAP[pieceType] ?? pieceType;
                const side = color === Color.BLACK ? "sente" : "gote";
                const typeName = PType[basePieceType];

                // ID生成
                const baseId = `${side}-${typeName}`;
                counts[baseId] = (counts[baseId] || 0) + 1;
                const uniqueId = `${baseId}-${counts[baseId]}`;

                // 各種データを格納
                positions[uniqueId] = gridToWorld(rowIndex, colIndex, isFlipped);
                owners[uniqueId] = color;
                promotions[uniqueId] = pieceType >= PType.PRO_PAWN;
            }
        });
    });

    // 2. 持ち駒（Hands）をスキャン
    Object.entries(state.hands).forEach(([colorStr, hand]) => {
        const color = Number(colorStr) as Color;
        const side = color === Color.BLACK ? "sente" : "gote";
        const coordsSource = color === Color.BLACK ? SENTE_HAND_COORDS : GOTE_HAND_COORDS;

        Object.entries(hand).forEach(([typeStr, count]) => {
            const pieceType = Number(typeStr) as PType;
            if (count <= 0) return;

            const baseType = pieceType >= PType.PRO_PAWN ? (pieceType - PType.PRO_PAWN) : pieceType;
            const typeName = PType[pieceType];
            const handPos = coordsSource[baseType as PieceType] || [0, 10, 0];

            for (let i = 0; i < count; i++) {
                const baseHandId = `${side}-${typeName}-hand`;
                counts[baseHandId] = (counts[baseHandId] || 0) + 1;
                const uniqueId = `${baseHandId}-${counts[baseHandId]}`;

                positions[uniqueId] = [...handPos];
                owners[uniqueId] = color;
                promotions[uniqueId] = false; // 持ち駒は必ず「未成り」
            }
        });
    });

    return { positions, owners, promotions };
}