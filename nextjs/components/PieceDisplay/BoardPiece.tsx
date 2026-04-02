import { getPieceRotation, gridToWorld, MODEL, Piece, PieceType, PromotedPieceType, PType } from "@torassen/shogi-logic";
import { Color } from "@torassen/shogi-logic";
import DraggablePiece from "./DraggablePiece";
import * as THREE from "three";

interface BoardPiece {
    board: (Piece | null)[][],
    isFlipped:boolean,
    selectedPiece: string,
    playerColor: Color,
    isMyTurn: boolean,
    handleSelect: (id: string | null) => void;
    handleDragEnd: (id: string, newPos: [number, number, number]) => void;
    boardGroupRef: React.RefObject<THREE.Group>;
}

export default function BoardPieceDisplay(props: BoardPiece) {

    const counts: Record<string, number> = {};

    const { board, isFlipped, selectedPiece, playerColor, isMyTurn, handleSelect, handleDragEnd, boardGroupRef } = props;

    return (
    <>
        {board.map((row, rowIndex) => 
            row.map((cell, colIndex) => {

                if(!cell) return;

                const { color, pieceType } = cell;
                const side = color === Color.BLACK ? "sente" : "gote";
                const type = PType[pieceType];
                const baseId = `${side}-${type}`;

                // ここで個体識別用の番号を振る
                counts[baseId] = (counts[baseId] || 0) + 1;
                const uniqueKey = `${baseId}-${counts[baseId]}`;

                const isPromoted = (type: PType | PieceType | PromotedPieceType): boolean => {
                    return type >= PType.PRO_PAWN;
                }
                    
                const draggable = playerColor === color && isMyTurn;
                
                return (
                    <DraggablePiece
                    key={uniqueKey}
                    pieceId={uniqueKey}
                    modelPath={MODEL[pieceType]}
                    initialPosition={gridToWorld(rowIndex, colIndex, isFlipped)}
                    rotation={getPieceRotation(baseId, color, isPromoted(pieceType), isFlipped)}
                    count={0}
                    selectedId={selectedPiece}
                    isPromoted={isPromoted(pieceType)}
                    onSelect={handleSelect}
                    onDragEnd={handleDragEnd}
                    parentGroupRef={boardGroupRef}
                    draggable={draggable}
                    />
                );
            })
        )}
    </>
    );
}