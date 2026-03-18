// @ts-nocheck
"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import { Suspense, useRef, useState, useCallback, useEffect } from "react";
import * as THREE from "three";

function TatamiModel() {
	const { scene } = useGLTF("/models/tatami.glb");
	// 畳は影を受ける
	scene.traverse((child) => {
		if ((child as THREE.Mesh).isMesh) {
			child.receiveShadow = true;
		}
	});
	return <primitive object={scene} scale={[1, 1, 1]} position={[0, -1, 0]} rotation={[(Math.PI / 180) * 30, Math.PI / 2, 0]} />;
}

function BanModelContent() {
	const { scene } = useGLTF("/models/ban.glb");
	// 盤は影を落とし・受ける
	scene.traverse((child) => {
		if ((child as THREE.Mesh).isMesh) {
			child.castShadow = true;
		}
	});
	return <primitive object={scene} scale={[1, 1, 1]} position={[0, 0, 0]} rotation={[0, 0, 0]} />;
}

// ドラッグ可能な駒コンポーネント
function DraggablePiece({
	modelPath,
	initialPosition,
	rotation,
	scale = [0.9, 0.9, 0.9],
	pieceId,
	selectedId,
	onSelect,
	onDragEnd,
	parentGroupRef
}: {
	modelPath: string;
	initialPosition: [number, number, number];
	rotation: [number, number, number];
	scale?: [number, number, number];
	pieceId: string;
	selectedId: string | null;
	onSelect: (id: string | null) => void;
	onDragEnd: (id: string, newPos: [number, number, number]) => void;
	parentGroupRef: React.RefObject<THREE.Group>;
}) {
	const { scene } = useGLTF(modelPath);
	const clonedScene = scene.clone();
	// 駒の全メッシュに影を落とす設定
	clonedScene.traverse((child) => {
		if ((child as THREE.Mesh).isMesh) {
			child.castShadow = true;
		}
	});
	const groupRef = useRef<THREE.Group>(null);
	const [pos, setPos] = useState<[number, number, number]>(initialPosition);
	const [isDragging, setIsDragging] = useState(false);
	const isSelected = selectedId === pieceId;
	const { camera, gl } = useThree();

	// 外部から位置が変わった場合（スナップや盤外戻し）に同期
	useEffect(() => {
		setPos(initialPosition);
	}, [initialPosition[0], initialPosition[1], initialPosition[2]]);

	const raycasterRef = useRef(new THREE.Raycaster());
	const mouseRef = useRef(new THREE.Vector2());
	const intersectPoint = useRef(new THREE.Vector3());
	const posRef = useRef<[number, number, number]>(initialPosition);

	// posRefを最新のposと同期
	posRef.current = pos;

	const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
		e.stopPropagation();
		onSelect(pieceId);
		setIsDragging(true);
		gl.domElement.style.cursor = "grabbing";

		// 駒のワールド位置を取得してドラッグ平面を設定
		const parentGroup = parentGroupRef.current;
		if (!parentGroup || !groupRef.current) return;

		// 駒のワールド位置を取得
		const worldPos = new THREE.Vector3();
		groupRef.current.getWorldPosition(worldPos);

		// 親グループのワールドY軸方向（ローカルY軸のワールド表現）を法線として使用
		// これにより回転されたグループの「上面」に沿ったドラッグ平面になる
		const normal = new THREE.Vector3(0, 1, 0);
		normal.applyQuaternion(parentGroup.quaternion);
		const dragPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, worldPos);

		const onMove = (ev: PointerEvent) => {
			const rect = gl.domElement.getBoundingClientRect();
			mouseRef.current.set(
				((ev.clientX - rect.left) / rect.width) * 2 - 1,
				-((ev.clientY - rect.top) / rect.height) * 2 + 1
			);
			raycasterRef.current.setFromCamera(mouseRef.current, camera);

			if (raycasterRef.current.ray.intersectPlane(dragPlane, intersectPoint.current)) {
				// ワールド座標をペアレントグループのローカル座標に変換
				const localPos = parentGroup.worldToLocal(intersectPoint.current.clone());
				const newPos: [number, number, number] = [localPos.x, posRef.current[1], localPos.z];
				posRef.current = newPos;
				setPos(newPos);
			}
		};

		const onUp = () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
			gl.domElement.style.cursor = "auto";
			setIsDragging(false);
			onDragEnd(pieceId, posRef.current);
		};

		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
	}, [pieceId, onSelect, onDragEnd, gl, camera, parentGroupRef]);

	return (
		<group
			ref={groupRef}
			position={[pos[0], pos[1] + (isDragging ? 1 : 0), pos[2]]}
			onPointerDown={handlePointerDown}
			onPointerOver={() => { gl.domElement.style.cursor = "grab"; }}
			onPointerOut={() => { gl.domElement.style.cursor = "auto"; }}
		>
			{/* 選択時のハイライト（光るリング） */}
			{isSelected && (
				<mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<ringGeometry args={[1.2, 1.6, 32]} />
					<meshBasicMaterial color="#ffd700" transparent opacity={0.6} side={THREE.DoubleSide} />
				</mesh>
			)}
			{/* クリック用の透明ヒットエリア（駒の当たり判定を広くする） */}
			<mesh visible={false}>
				<boxGeometry args={[2.5, 2.5, 2.5]} />
				<meshBasicMaterial transparent opacity={0} />
			</mesh>
			<primitive
				object={clonedScene}
				scale={scale}
				rotation={rotation}
			/>
		</group>
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

// 盤面のグリッド座標定義（5×5）
// Row 0 (後手側) → Row 4 (先手側)
// Col 0 (左) → Col 4 (右)
const BOARD_BASE_X = 3.9;   // Row 0 の X 座標
const BOARD_ROW_STEP = -3.25; // 行ごとの X 間隔
const BOARD_BASE_Z = -6.3;  // Col 0 の Z 座標
const BOARD_COL_STEP = 3.175; // 列ごとの Z 間隔
const BOARD_Y = 10.0;       // 駒の Y 座標（高さ）

// グリッド座標 → 3D ワールド座標
function gridToWorld(row: number, col: number): [number, number, number] {
	return [
		BOARD_BASE_X + row * BOARD_ROW_STEP,
		BOARD_Y,
		BOARD_BASE_Z + col * BOARD_COL_STEP
	];
}

// 3D ワールド座標 → 最も近いグリッド座標
function worldToGrid(x: number, z: number): { row: number; col: number } | null {
	const row = Math.round((x - BOARD_BASE_X) / BOARD_ROW_STEP);
	const col = Math.round((z - BOARD_BASE_Z) / BOARD_COL_STEP);

	// 盤面内（0〜4）に収まっているかチェック
	if (row < 0 || row > 4 || col < 0 || col > 4) {
		return null; // 盤外
	}
	return { row, col };
}

export default function TatamiBackground() {
	const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
	const boardGroupRef = useRef<THREE.Group>(null);
	// 各駒の現在位置を管理（ドロップ後のスナップ位置を記録）
	const [piecePositions, setPiecePositions] = useState<Record<string, [number, number, number]>>({});

	const handleSelect = useCallback((id: string | null) => {
		setSelectedPiece(id);
	}, []);

	const handleDragEnd = useCallback((id: string, newPos: [number, number, number]) => {
		// ドロップ位置を最も近いグリッドにスナップ
		const grid = worldToGrid(newPos[0], newPos[2]);
		if (grid) {
			const snappedPos = gridToWorld(grid.row, grid.col);
			setPiecePositions(prev => ({ ...prev, [id]: snappedPos }));
			console.log(`駒 ${id} を (${grid.row}, ${grid.col}) に移動`);
		} else {
			// 盤外 → 元の位置に戻す（piecePositionsに記録がなければinitialPositionに戻る）
			setPiecePositions(prev => {
				const copy = { ...prev };
				delete copy[id];
				return copy;
			});
			console.log(`駒 ${id} は盤外のため元の位置に戻します`);
		}
	}, []);

	// 背景クリックで選択解除
	const handleBackgroundClick = useCallback(() => {
		setSelectedPiece(null);
	}, []);

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100vw",
				height: "100vh",
				zIndex: 1,
				background: "linear-gradient(to bottom, #1a1a2e, #0f0f1c)"
			}}
		>
			<Canvas shadows camera={{ position: [0, 20, 30], fov: 50 }}>
				<ambientLight intensity={0.4} />
				<directionalLight
					position={[0, 30, 0]}
					intensity={1.8}
					castShadow
					shadow-mapSize-width={2048}
					shadow-mapSize-height={2048}
					shadow-camera-far={100}
					shadow-camera-left={-30}
					shadow-camera-right={30}
					shadow-camera-top={30}
					shadow-camera-bottom={-30}
					shadow-bias={-0.001}
				/>
				<Suspense fallback={null}>
					<TatamiModel />

					{/* 盤と駒を同じグループに入れて一括で傾ける */}
					<group ref={boardGroupRef} position={[0, -0.9, 0]} rotation={[(Math.PI / 180) * 30, Math.PI / 2, 0]}>
						{/* 背景クリックで選択解除用の透明な平面 */}
						<mesh position={[0, 9.9, 0]} rotation={[-Math.PI / 2, 0, 0]} onClick={handleBackgroundClick} receiveShadow>
							<planeGeometry args={[50, 50]} />
							<shadowMaterial transparent opacity={0.4} />
						</mesh>

						<BanModelContent />

						{/* 駒台 (Sente: 左上) */}
						<DaiModelContent
							position={[-12.5, 0, -21]}
							rotation={[0, Math.PI, 0]}
							scale={[1, 1, 1]}
						/>

						{/* 駒台 (Gote: 右下) */}
						<DaiModelContent
							position={[-21.2, 0, 12.7]}
							rotation={[0, Math.PI, 0]}
							scale={[1, 1, 1]}
						/>

						{/* === 先手の駒 === */}

						{/* 王将 (Sente: Row 4, Col 0) */}
						<DraggablePiece
							pieceId="sente-ou"
							modelPath="/models/ousyo.glb"
							initialPosition={piecePositions["sente-ou"] || [-9.1, 10.0, -6.3]}
							rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
							selectedId={selectedPiece}
							onSelect={handleSelect}
							onDragEnd={handleDragEnd}
							parentGroupRef={boardGroupRef}
						/>

						{/* 金将 (Sente: Row 4, Col 1) */}
						<DraggablePiece
							pieceId="sente-kin"
							modelPath="/models/kin.glb"
							initialPosition={piecePositions["sente-kin"] || [-9.1, 10.0, -3.1]}
							rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
							selectedId={selectedPiece}
							onSelect={handleSelect}
							onDragEnd={handleDragEnd}
							parentGroupRef={boardGroupRef}
						/>

						{/* 銀将 (Sente: Row 4, Col 2) */}
						<DraggablePiece
							pieceId="sente-gin"
							modelPath="/models/gin.glb"
							initialPosition={piecePositions["sente-gin"] || [-9.1, 10.0, 0.0]}
							rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
							selectedId={selectedPiece}
							onSelect={handleSelect}
							onDragEnd={handleDragEnd}
							parentGroupRef={boardGroupRef}
						/>

						{/* 角行 (Sente: Row 4, Col 3) */}
						<DraggablePiece
							pieceId="sente-kaku"
							modelPath="/models/kaku.glb"
							initialPosition={piecePositions["sente-kaku"] || [-9.1, 10.0, 3.2]}
							rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
							selectedId={selectedPiece}
							onSelect={handleSelect}
							onDragEnd={handleDragEnd}
							parentGroupRef={boardGroupRef}
						/>

						{/* 飛車 (Sente: Row 4, Col 4) */}
						<DraggablePiece
							pieceId="sente-hisya"
							modelPath="/models/hisya.glb"
							initialPosition={piecePositions["sente-hisya"] || [-9.1, 10.0, 6.4]}
							rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
							selectedId={selectedPiece}
							onSelect={handleSelect}
							onDragEnd={handleDragEnd}
							parentGroupRef={boardGroupRef}
						/>

						{/* 歩兵 (Sente: Row 3, Col 0) */}
						<DraggablePiece
							pieceId="sente-fu"
							modelPath="/models/fu.glb"
							initialPosition={piecePositions["sente-fu"] || [-5.8, 10.0, -6.3]}
							rotation={[Math.PI / 2, 0, -Math.PI / 2]}
							selectedId={selectedPiece}
							onSelect={handleSelect}
							onDragEnd={handleDragEnd}
							parentGroupRef={boardGroupRef}
						/>

						{/* === 後手の駒 === */}

						{/* 玉将 (Gote: Row 0, Col 4) */}
						<DraggablePiece
							pieceId="gote-ou"
							modelPath="/models/ousyo_NoTen.glb"
							initialPosition={piecePositions["gote-ou"] || [3.9, 10.0, 6.4]}
							rotation={[Math.PI / 2, Math.PI, -Math.PI / 2]}
							selectedId={selectedPiece}
							onSelect={handleSelect}
							onDragEnd={handleDragEnd}
							parentGroupRef={boardGroupRef}
						/>

						{/* 金将 (Gote: Row 0, Col 3) */}
						<DraggablePiece
							pieceId="gote-kin"
							modelPath="/models/kin.glb"
							initialPosition={piecePositions["gote-kin"] || [3.9, 10.0, 3.1]}
							rotation={[Math.PI / 2, Math.PI, -Math.PI / 2]}
							selectedId={selectedPiece}
							onSelect={handleSelect}
							onDragEnd={handleDragEnd}
							parentGroupRef={boardGroupRef}
						/>

						{/* 銀将 (Gote: Row 0, Col 2) */}
						<DraggablePiece
							pieceId="gote-gin"
							modelPath="/models/gin.glb"
							initialPosition={piecePositions["gote-gin"] || [3.9, 10.0, -0.1]}
							rotation={[Math.PI / 2, Math.PI, -Math.PI / 2]}
							selectedId={selectedPiece}
							onSelect={handleSelect}
							onDragEnd={handleDragEnd}
							parentGroupRef={boardGroupRef}
						/>

						{/* 角行 (Gote: Row 0, Col 1) */}
						<DraggablePiece
							pieceId="gote-kaku"
							modelPath="/models/kaku.glb"
							initialPosition={piecePositions["gote-kaku"] || [3.9, 10.0, -3.2]}
							rotation={[Math.PI / 2, Math.PI, -Math.PI / 2]}
							selectedId={selectedPiece}
							onSelect={handleSelect}
							onDragEnd={handleDragEnd}
							parentGroupRef={boardGroupRef}
						/>

						{/* 飛車 (Gote: Row 0, Col 0) */}
						<DraggablePiece
							pieceId="gote-hisya"
							modelPath="/models/hisya.glb"
							initialPosition={piecePositions["gote-hisya"] || [3.9, 10.0, -6.4]}
							rotation={[Math.PI / 2, Math.PI, -Math.PI / 2]}
							selectedId={selectedPiece}
							onSelect={handleSelect}
							onDragEnd={handleDragEnd}
							parentGroupRef={boardGroupRef}
						/>

						{/* 歩兵 (Gote: Row 1, Col 4) */}
						<DraggablePiece
							pieceId="gote-fu"
							modelPath="/models/fu.glb"
							initialPosition={piecePositions["gote-fu"] || [0.6, 10.0, 6.3]}
							rotation={[-Math.PI / 2, Math.PI, -Math.PI / 2]}
							selectedId={selectedPiece}
							onSelect={handleSelect}
							onDragEnd={handleDragEnd}
							parentGroupRef={boardGroupRef}
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
