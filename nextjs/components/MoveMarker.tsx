// @ts-nocheck
import { gridToWorld } from "@torassen/shogi-logic";
import * as THREE from "three";

// 1. 個別のマーカーを表示する小さな部品（サブコンポーネント）
interface MarkerMesh {
    position: [number, number, number],
}

function MarkerMesh(props: MarkerMesh) {
    return (
        <mesh position={[props.position[0], props.position[1] + 0.1, props.position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 1.2, 32]} />
            <meshBasicMaterial color="#4ade80" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
    );
}

interface MoveMarker {
    validMoveDestinations: any[],
    isFlipped: boolean
}

function MoveMarker(props: MoveMarker) {
    return (
        <>
            {props.validMoveDestinations.map((dest, idx) => {

                const pos = gridToWorld(dest.row, dest.col, props.isFlipped);

                // JSXとしてレンダリングし、keyを渡す
                return <MarkerMesh key={`marker-${idx}`} position={pos} />;
            })}
        </>
    );
}

export default MoveMarker;