// @ts-nocheck

import { Environment } from "@react-three/drei";
import BanModelContent from "./BanModel";
import DaiModelContent from "./DaiModel";
import TatamiModel from "./TatamiModel";
import * as THREE from "three";
import { RefObject } from "react"

interface Background {
    isFlipped: boolean,
    boardGroupRef: RefObject<THREE.Group<THREE.Object3DEventMap> | null>
}

export default function Background(props: Background) {
    return (
        <>
            <TatamiModel />

            {/* 盤と駒を同じグループに入れて一括で傾ける */}
            <group ref={props.boardGroupRef} position={[0, -0.9, 0]} rotation={[(Math.PI / 180) * 30, Math.PI / 2, 0]}>

                <BanModelContent />

                {/* 自分の駒台 (常に右下) */}
                <DaiModelContent
                    position={props.isFlipped ? [-12.5, 0, -21] : [-21.2, 0, 12.7]}
                    rotation={[0, Math.PI, 0]}
                    scale={[1, 1, 1]}
                />

                {/* 相手の駒台 (常に左上) */}
                <DaiModelContent
                    position={props.isFlipped ? [-21.2, 0, 12.7] : [-12.5, 0, -21]}
                    rotation={[0, Math.PI, 0]}
                    scale={[1, 1, 1]}
                />
            </group>

            <Environment preset="sunset" />
        </>
    )
}