// @ts-nocheck
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

function BanModelContent() {
	const { scene } = useGLTF("/models/ban.glb");
	// 盤は影を落とし・受ける
	scene.traverse((child) => {
		if ((child as THREE.Mesh).isMesh) {
			const mesh = child as THREE.Mesh;
			mesh.castShadow = true;
			// mesh.receiveShadow = true; // 駒の影を受けるように設定

			// 反射を消すために roughness を最大、metalness を最小にし、環境マップの影響を無視する
			const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
			materials.forEach((mat) => {
				if (mat instanceof THREE.MeshStandardMaterial) {
					mat.roughness = 1.0;
					mat.metalness = 0.0;
					mat.envMapIntensity = 0;
				}
			});
		}
	});
	return <primitive object={scene} scale={[1, 1, 1]} position={[0, 0, 0]} rotation={[0, 0, 0]} />;
}

export default BanModelContent;