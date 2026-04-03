import { Color } from "./types";

export function getPieceRotation(
    id: string, 
    color: Color, 
    isPromoted: boolean, 
    isFlipped: boolean = false
): [number, number, number] {
    const isFu = id.includes("PAWN");
    
    // 視点が反転している場合、駒の向き（基本向き）も反転させる
    const visualColor = isFlipped ? (color === Color.BLACK ? Color.WHITE : Color.BLACK) : color;
    const isVisualSente = visualColor === Color.BLACK;

    let rotation: [number, number, number];

    // 歩兵(fu.glb)だけモデルの基本向きが違うため調整
    if (isFu) {
        rotation = isVisualSente ? [Math.PI / 2, 0, -Math.PI / 2] : [-Math.PI / 2, Math.PI, -Math.PI / 2];
    } else {
        rotation = isVisualSente ? [-Math.PI / 2, 0, -Math.PI / 2] : [Math.PI / 2, Math.PI, -Math.PI / 2];
    }

    // 成っている場合は裏返しにする(X軸180度回転)
    if (isPromoted) {
        return [rotation[0] + Math.PI, rotation[1], rotation[2]];
    }
    return rotation;
}