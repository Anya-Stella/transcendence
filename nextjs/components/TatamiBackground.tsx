// @ts-nocheck
"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import { Suspense } from "react";

function TatamiModel() {
	const { scene } = useGLTF("/models/tatami.glb");
	// 30度（Math.PI / 6）X軸で起き上がらせる
	return <primitive object={scene} scale={[1, 1, 1]} position={[0, -1, 0]} rotation={[(Math.PI / 180) * 30, Math.PI / 2, 0]} />;
}

function BanModelContent() {
	const { scene } = useGLTF("/models/ban.glb");
	return <primitive object={scene} scale={[1, 1, 1]} position={[0, 0, 0]} rotation={[0, 0, 0]} />;
}

function PieceModelContent({ modelPath, position, rotation, scale = [5, 5, 5] }: { modelPath: string, position: [number, number, number], rotation: [number, number, number], scale?: [number, number, number] }) {
	const { scene } = useGLTF(modelPath);
	const clonedScene = scene.clone();

	return (
		<primitive
			object={clonedScene}
			scale={scale}
			position={position}
			rotation={rotation}
		/>
	);
}

function DaiModelContent({ position, rotation, scale = [1, 1, 1] }: { position: [number, number, number], rotation: [number, number, number], scale?: [number, number, number] }) {
	const { scene } = useGLTF("/models/dai.glb");
	const clonedScene = scene.clone();

	return (
		<primitive
			object={clonedScene}
			scale={scale}
			position={position}
			rotation={rotation}
		/>
	);
}

export default function TatamiBackground() {
	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100vw",
				height: "100vh",
				zIndex: -1,
				pointerEvents: "none",
				background: "linear-gradient(to bottom, #1a1a2e, #0f0f1c)"
			}}
		>
			<Canvas camera={{ position: [0, 20, 30], fov: 50 }}>
				<ambientLight intensity={0.6} />
				<directionalLight position={[10, 10, 10]} intensity={1.5} castShadow />
				<Suspense fallback={null}>
					<TatamiModel />

					{/* 盤と駒を同じグループに入れて一括で傾ける */}
					<group position={[0, -0.9, 0]} rotation={[(Math.PI / 180) * 30, Math.PI / 2, 0]}>
						<BanModelContent />

						{/* 駒台 (Sente: 右下) */}
						<DaiModelContent
							position={[-12.5, 0, -21]}
							rotation={[0, Math.PI, 0]}
							scale={[1, 1, 1]}
						/>

						{/* 駒台 (Gote: 左上) */}
						<DaiModelContent
							position={[-21, 0, 13]}
							rotation={[0, Math.PI, 0]}
							scale={[1, 1, 1]}
						/>

						{/* 王将 (Sente: 左下 Row 4, Col 0) */}
						<PieceModelContent
							modelPath="/models/ousyo.glb"
							//駒の位置
							position={[-9.1, 10.0, -6.3]}
							//駒の向き
							rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
							//駒の大きさ
							scale={[0.9, 0.9, 0.9]}
						/>

						{/* 玉将 (Gote: 右上 Row 0, Col 4) */}
						<PieceModelContent
							modelPath="/models/ousyo_NoTen.glb"
							//駒の位置
							position={[3.9, 10.0, 6.4]}
							//駒の向き
							rotation={[Math.PI / 2, Math.PI, -Math.PI / 2]}
							//駒の大きさ
							scale={[0.9, 0.9, 0.9]}
						/>

						{/* 金将 (Sente: Row 4, Col 1) */}
						<PieceModelContent
							modelPath="/models/kin.glb"
							position={[-9.1, 10.0, -3.1]} // Xは王と同じ、Zをずらして隣へ
							rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
							scale={[0.9, 0.9, 0.9]}
						/>

						{/* 金将 (Gote: Row 0, Col 3) */}
						<PieceModelContent
							modelPath="/models/kin.glb"
							position={[3.9, 10.0, 3.1]} // Xは王と同じ、Zをずらして隣へ
							rotation={[Math.PI / 2, Math.PI, -Math.PI / 2]}
							scale={[0.9, 0.9, 0.9]}
						/>

						{/* 銀将 (Sente: Row 4, Col 2) */}
						<PieceModelContent
							modelPath="/models/gin.glb"
							position={[-9.1, 10.0, 0.0]} // 金の隣へ
							rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
							scale={[0.9, 0.9, 0.9]}
						/>

						{/* 銀将 (Gote: Row 0, Col 2) */}
						<PieceModelContent
							modelPath="/models/gin.glb"
							position={[3.9, 10.0, -0.1]} // 金の隣へ
							rotation={[Math.PI / 2, Math.PI, -Math.PI / 2]}
							scale={[0.9, 0.9, 0.9]}
						/>

						{/* 角行 (Sente: Row 4, Col 3) */}
						<PieceModelContent
							modelPath="/models/kaku.glb"
							position={[-9.1, 10.0, 3.2]} // 銀の隣へ
							rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
							scale={[0.9, 0.9, 0.9]}
						/>

						{/* 角行 (Gote: Row 0, Col 1) */}
						<PieceModelContent
							modelPath="/models/kaku.glb"
							position={[3.9, 10.0, -3.2]} // 銀の隣へ
							rotation={[Math.PI / 2, Math.PI, -Math.PI / 2]}
							scale={[0.9, 0.9, 0.9]}
						/>

						{/* 飛車 (Sente: Row 4, Col 4) */}
						<PieceModelContent
							modelPath="/models/hisya.glb"
							position={[-9.1, 10.0, 6.4]} // 角の隣へ
							rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
							scale={[0.9, 0.9, 0.9]}
						/>

						{/* 飛車 (Gote: Row 0, Col 0) */}
						<PieceModelContent
							modelPath="/models/hisya.glb"
							position={[3.9, 10.0, -6.4]} // 角の隣へ
							rotation={[Math.PI / 2, Math.PI, -Math.PI / 2]}
							scale={[0.9, 0.9, 0.9]}
						/>

						{/* 歩兵 (Sente: Row 3, Col 0) */}
						<PieceModelContent
							modelPath="/models/fu.glb"
							position={[-5.8, 10.0, -6.3]} // 1段上のCol 0
							rotation={[Math.PI / 2, 0, -Math.PI / 2]}
							scale={[0.9, 0.9, 0.9]}
						/>

						{/* 歩兵 (Gote: Row 1, Col 4) */}
						<PieceModelContent
							modelPath="/models/fu.glb"
							position={[0.6, 10.0, 6.3]} // 1段下のCol 4
							rotation={[-Math.PI / 2, Math.PI, -Math.PI / 2]}
							scale={[0.9, 0.9, 0.9]}
						/>
					</group>

					<Environment preset="sunset" />
				</Suspense>
			</Canvas>
		</div>
	);
}

useGLTF.preload("/models/tatami.glb");
useGLTF.preload("/models/ban.glb");
useGLTF.preload("/models/dai.glb");
useGLTF.preload("/models/ousyo.glb");
useGLTF.preload("/models/ousyo_NoTen.glb");
useGLTF.preload("/models/kin.glb");
useGLTF.preload("/models/gin.glb");
useGLTF.preload("/models/kaku.glb");
useGLTF.preload("/models/hisya.glb");
useGLTF.preload("/models/fu.glb");
