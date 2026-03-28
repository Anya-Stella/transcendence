// @ts-nocheck
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface DaiModelContent {
    position: [number, number, number],
    rotation: [number, number, number],
    scale?: [number, number, number]
}

function DaiModelContent({ position, rotation, scale = [1, 1, 1] }: DaiModelContent) {
    const { scene } = useGLTF("/models/dai.glb");
    const clonedScene = scene.clone();

    clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            // モデル内に元々含まれている影用メッシュを非表示にする
            if (mesh.name.toLowerCase().includes("shadow") || mesh.name.toLowerCase().includes("plane")) {
                mesh.visible = false;
                return;
            }
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            // 環境マップ（背景画像）からの自動ライティングを無効化
            if (mesh.material instanceof THREE.MeshStandardMaterial) {
                mesh.material.envMapIntensity = 0;
            }
        }
    });

    return (
        <primitive
            object={clonedScene}
            scale={scale}
            position={position}
            rotation={rotation}
        />
    );
}

export default DaiModelContent;