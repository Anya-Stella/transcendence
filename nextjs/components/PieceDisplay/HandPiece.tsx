import { getPieceRotation, gridToWorld, Hand, HAND_PIECE_COORDS, MODEL, Piece, PieceType, PromotedPieceType, PType, SENTE_HAND_COORDS } from "@torassen/shogi-logic";
import { Color } from "@torassen/shogi-logic";
import * as THREE from "three";
import DraggablePiece from "./DraggablePiece";

const HAND_COORDS: Record<number, Record<number, [number,number,number]>> = {
    [Color.BLACK]: {
        0: [-3, 10.0, 10.2],
        1: [-7.1, 10.0, 10.2],
        2: [-7.1, 10.0, 13.2],
        3: [-3, 10.0, 16.2],
        4: [-3, 10.0, 13.2],
    },
    [Color.WHITE]: {
        0: [-2.7, 10.0, -10.2],
        1: [1.5, 10.0, -10.2],
        2: [1.5, 10.0, -13.2],
        3: [-2.7, 10.0, -16.2],
        4: [-2.7, 10.0, -13.2],
    }
};

interface HandPiece {
    Hand: [Hand,Hand],
    isFlipped:boolean,
    selectedPiece: string,
    playerColor: Color,
    isMyTurn: boolean,
    handleSelect: (id: string | null) => void;
    handleDragEnd: (id: string, newPos: [number, number, number]) => void;
    boardGroupRef: React.RefObject<THREE.Group>;
}

export default function HandPieceDisplay(props: HandPiece) {

    const counts: Record<string, number> = {};

    const { Hand, isFlipped, selectedPiece, playerColor, isMyTurn, handleSelect, handleDragEnd, boardGroupRef } = props;

    return (
    <>
        {Hand.map((hands, color) => {
            return Object.entries(hands).map((piece) => {
                if(!piece[1]) return null;

                const type = Number(piece[0]) as PType;
                const count = piece[1];
                
                const side = color === Color.BLACK ? "sente" : "gote";
                const baseId = `${side}-${PType[type]}-hand`;

                counts[baseId] = (counts[baseId] || 0) + 1;
                const uniqueKey = `${baseId}-${counts[baseId]}`;
                    
                const draggable = playerColor === color && isMyTurn;

            return (
                <DraggablePiece
                key={uniqueKey}
                pieceId={uniqueKey}
                modelPath={MODEL[type]}
                initialPosition={HAND_COORDS[color][type]}
                rotation={getPieceRotation(baseId, color, false, isFlipped)}
                count={count}
                selectedId={selectedPiece}
                isPromoted={false}
                onSelect={handleSelect}
                onDragEnd={handleDragEnd}
                parentGroupRef={boardGroupRef}
                draggable={draggable}
                />
            );
            })
        })}
    </>
    );
}