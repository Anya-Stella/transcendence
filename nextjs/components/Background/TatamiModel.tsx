// @ts-nocheck
"use client"

import { useGLTF } from "@react-three/drei";
import * as THREE from "three";


function TatamiModel() {
    const { scene } = useGLTF("/models/tatami.glb");
    const clonedScene = scene.clone();

    // 畳は影を受ける
    clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            // モデル内に元々含まれている影用メッシュを非表示にする
            if (mesh.name.toLowerCase().includes("shadow") || mesh.name.toLowerCase().includes("plane")) {
                mesh.visible = false;
                return;
            }
            mesh.receiveShadow = true;
            // 環境マップ（背景画像）からの自動ライティングを無効化
            if (mesh.material instanceof THREE.MeshStandardMaterial) {
                mesh.material.envMapIntensity = 0;
            }
        }
    });
    return <primitive object={clonedScene} scale={[1, 1, 1]} position={[0, -1, 0]} rotation={[(Math.PI / 180) * 30, Math.PI / 2, 0]} />;
}

export default TatamiModel;