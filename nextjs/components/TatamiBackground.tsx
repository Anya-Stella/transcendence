// @ts-nocheck
"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import { Suspense } from "react";

function TatamiModel() {
	const { scene } = useGLTF("/models/tatami.glb");
	// 10度（Math.PI / 18）X軸で起き上がらせる
	return <primitive object={scene} scale={[1, 1, 1]} position={[0, -1, 0]} rotation={[(Math.PI / 180) * 10, Math.PI / 2, 0]} />;
}

function BanModel() {
	const { scene } = useGLTF("/models/ban.glb");
	// 盤を畳の上に垂直（90度）に配置し、重ならないよう高さを少し調整
	// 畳と同じX軸の起き上がり（10度）と、Y軸で畳と垂直になるよう調整
	return <primitive object={scene} scale={[1, 1, 1]} position={[0, -0.9, 0]} rotation={[(Math.PI / 180) * 10, 0, 0]} />;
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
					<BanModel />
					<Environment preset="sunset" />
				</Suspense>
			</Canvas>
		</div>
	);
}

useGLTF.preload("/models/tatami.glb");
useGLTF.preload("/models/ban.glb");
