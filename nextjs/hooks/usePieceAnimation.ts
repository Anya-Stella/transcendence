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
    isPromoted?: boolean;                          // 【NEW】成り状況
    isGameOver?: boolean;                          // 【NEW】終局アニメーション用
}

export function usePieceAnimation({
    positionGroupRef,
    rotationGroupRef,
    targetPos,
    targetRotation,
    isDragging,
    isPromoted,
    isGameOver
}: UsePieceAnimationProps) {
    const isFirstFrame = useRef(true);

    // 落下演出用の設定
    const dropOffset = useRef(Math.random() * 15 + 20);

    // 爆発演出用の設定
    const explosionVel = useRef<THREE.Vector3 | null>(null);
    const explosionRotVel = useRef<THREE.Vector3 | null>(null);

    // 成りアニメーション用の状態管理
    const prevPromoted = useRef<boolean | undefined>(undefined);
    const promotionAnimTimer = useRef(0);
    const PROMOTION_DURATION = 0.6; // 秒

    // 目標の回転（クォータニオン）を保持
    const targetQuat = useRef(new THREE.Quaternion());
    const targetVec = useRef(new THREE.Vector3());

    useFrame((_state, delta) => {
        if (!positionGroupRef.current || !rotationGroupRef.current) return;

        // --- 終局（爆発）アニメーション ---
        if (isGameOver) {
            if (!explosionVel.current) {
                // 初回に爆発の方向をランダムに決定
                const angle = Math.random() * Math.PI * 2;
                const speed = 15 + Math.random() * 20;
                explosionVel.current = new THREE.Vector3(
                    Math.cos(angle) * speed,
                    20 + Math.random() * 20, // 上方向に強めに飛ばす
                    Math.sin(angle) * speed
                );
                explosionRotVel.current = new THREE.Vector3(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10
                );
            }

            // 位置の更新（重力付き）
            positionGroupRef.current.position.addScaledVector(explosionVel.current, delta);
            explosionVel.current.y -= 40 * delta; // 重力

            // 回転の更新
            if (explosionRotVel.current) {
                rotationGroupRef.current.rotation.x += explosionRotVel.current.x * delta;
                rotationGroupRef.current.rotation.y += explosionRotVel.current.y * delta;
                rotationGroupRef.current.rotation.z += explosionRotVel.current.z * delta;
            }

            return; // 爆発中は他のアニメーションをスキップ
        }

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
            prevPromoted.current = isPromoted; // 初回の状態を記録
            return;
        }

        // --- 成り状況の変化を検知 ---
        if (prevPromoted.current !== undefined && prevPromoted.current !== isPromoted) {
            promotionAnimTimer.current = PROMOTION_DURATION;
            prevPromoted.current = isPromoted;
        }

        // --- アニメーションロジック ---
        if (isDragging) {
            // ドラッグ中は少し浮かせて即座に追従
            positionGroupRef.current.position.set(
                targetVec.current.x,
                targetVec.current.y + 1,
                targetVec.current.z
            );
            rotationGroupRef.current.quaternion.copy(targetQuat.current);
        } else {
            // 通常時: ジャンプ効果の計算
            let jumpBonus = 0;
            if (promotionAnimTimer.current > 0) {
                const progress = 1.0 - (promotionAnimTimer.current / PROMOTION_DURATION);
                jumpBonus = Math.sin(progress * Math.PI) * 2.5;
                promotionAnimTimer.current -= delta;
            }

            const animTargetPos = targetVec.current.clone();
            animTargetPos.y += jumpBonus;

            // 滑らかに目標へ移動 (Lerp)
            positionGroupRef.current.position.lerp(animTargetPos, 0.2);

            // 回転も滑らかに補間 (Slerp)
            const slerpSpeed = promotionAnimTimer.current > 0 ? 0.25 : 0.15;
            rotationGroupRef.current.quaternion.slerp(targetQuat.current, slerpSpeed);
        }
    });
}