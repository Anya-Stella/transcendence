// hooks/usePieceAnimation.ts
import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface UsePieceAnimationProps {
    positionGroupRef: React.RefObject<THREE.Group>; // 位置・水平移動用
    rotationGroupRef: React.RefObject<THREE.Group>; // 駒自体の回転用
    targetPos: [number, number, number];           // 目標座標
    targetRotation: [number, number, number];      // 目標角度（オイラー角）
    isDragging: boolean;                           // ドラッグ中か
}

export function usePieceAnimation({
    positionGroupRef,
    rotationGroupRef,
    targetPos,
    targetRotation,
    isDragging
}: UsePieceAnimationProps) {
    const isFirstFrame = useRef(true);
    
    // 落下演出用の設定
    // 最初にランダムな高さから降ってくる（20〜35の高さ）
    const dropOffset = useRef(Math.random() * 15 + 20);

    // 目標の回転（クォータニオン）をメモ化に近い形で保持
    const targetQuat = useRef(new THREE.Quaternion());
    const targetVec = useRef(new THREE.Vector3());

    useFrame((_state, _delta) => {
        if (!positionGroupRef.current || !rotationGroupRef.current) return;

        // 目標値をThree.jsの型に変換
        targetVec.current.set(...targetPos);
        const euler = new THREE.Euler(...targetRotation);
        targetQuat.current.setFromEuler(euler);

        // --- 初回フレーム：落下開始地点へ配置 ---
        if (isFirstFrame.current) {
            positionGroupRef.current.position.set(
                targetVec.current.x,
                targetVec.current.y + dropOffset.current,
                targetVec.current.z
            );
            rotationGroupRef.current.quaternion.copy(targetQuat.current);
            isFirstFrame.current = false;
            return;
        }

        // --- アニメーションロジック ---
        if (isDragging) {
            // ドラッグ中は遊びを持たせず、少し浮かせて即座に追従
            positionGroupRef.current.position.set(
                targetVec.current.x,
                targetVec.current.y + 1, // 指で隠れないように少し浮かす
                targetVec.current.z
            );
            rotationGroupRef.current.quaternion.copy(targetQuat.current);
        } else {
            // 通常時：滑らかに目標へ移動 (Lerp)
            // 0.2 は追従速度。小さいほどゆっくり、大きいほどキビキビ動く
            positionGroupRef.current.position.lerp(targetVec.current, 0.2);

            // 回転も滑らかに補間 (Slerp)
            rotationGroupRef.current.quaternion.slerp(targetQuat.current, 0.15);
        }
    });
}