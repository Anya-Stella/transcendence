// @ts-nocheck
"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import { Suspense, useRef, useState, useCallback, useEffect, useMemo } from "react";
import * as THREE from "three";
import {
	Color,
	PieceType,
	createInitialBoard,
	isLegalMove,
	applyMove,
	generateLegalMoves,
	type BoardState,
	type Move,
	type Square
} from "@torassen/shogi-logic";

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
			// ドロップ後に位置を強制的に再同期する（無効な位置の場合は initialPosition に戻るため）
			setPos(initialPosition);
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
					<meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} />
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

// 移動可能な場所を表示するマーカー
function MoveMarker({ position }: { position: [number, number, number] }) {
	return (
		<mesh position={[position[0], position[1] + 0.1, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
			<ringGeometry args={[0.8, 1.2, 32]} />
			<meshBasicMaterial color="#4ade80" transparent opacity={0.6} side={THREE.DoubleSide} />
		</mesh>
	);
}

// 盤面のグリッド座標定義（5×5）
// Row 0 (後手側: X=3.9) → Row 4 (先手側: X=-9.1)
// Col 0 (左: Z=-6.4) → Col 4 (右: Z=6.4)
const BOARD_X_COORDS = [3.9, 0.6, -2.7, -6.0, -9.1];
const BOARD_Z_COORDS = [-6.4, -3.2, 0, 3.2, 6.4];
const BOARD_Y = 10.0;       // 駒の Y 座標（高さ）

// グリッド座標 → 3D ワールド座標
function gridToWorld(row: number, col: number): [number, number, number] {
	return [
		BOARD_X_COORDS[row],
		BOARD_Y,
		BOARD_Z_COORDS[col]
	];
}

// 3D ワールド座標 → 最も近いグリッド座標
function worldToGrid(x: number, z: number): { row: number; col: number } | null {
	// 最も近いX座標のインデックスを探す
	let bestRow = 0;
	let minXDist = Math.abs(x - BOARD_X_COORDS[0]);
	for (let i = 1; i < BOARD_X_COORDS.length; i++) {
		const dist = Math.abs(x - BOARD_X_COORDS[i]);
		if (dist < minXDist) {
			minXDist = dist;
			bestRow = i;
		}
	}

	// 最も近いZ座標のインデックスを探す
	let bestCol = 0;
	let minZDist = Math.abs(z - BOARD_Z_COORDS[0]);
	for (let i = 1; i < BOARD_Z_COORDS.length; i++) {
		const dist = Math.abs(z - BOARD_Z_COORDS[i]);
		if (dist < minZDist) {
			minZDist = dist;
			bestCol = i;
		}
	}

	return { row: bestRow, col: bestCol };
}

// 各駒の初期グリッド位置（駒の移動判定に使用）
const PIECE_INITIAL_GRID: Record<string, Square> = {
	"sente-ou": { row: 4, col: 0 },
	"sente-kin": { row: 4, col: 1 },
	"sente-gin": { row: 4, col: 2 },
	"sente-kaku": { row: 4, col: 3 },
	"sente-hisya": { row: 4, col: 4 },
	"sente-fu": { row: 3, col: 0 },
	"gote-ou": { row: 0, col: 4 },
	"gote-kin": { row: 0, col: 3 },
	"gote-gin": { row: 0, col: 2 },
	"gote-kaku": { row: 0, col: 1 },
	"gote-hisya": { row: 0, col: 0 },
	"gote-fu": { row: 1, col: 4 },
};

export default function TatamiBackground() {
	const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
	const boardGroupRef = useRef<THREE.Group>(null);
	// 将棋の論理的な盤面状態
	const [boardState, setBoardState] = useState<BoardState>(() => createInitialBoard());
	// 各駒の現在位置（ワールド座標）を管理
	const [piecePositions, setPiecePositions] = useState<Record<string, [number, number, number]>>({});

	const handleSelect = useCallback((id: string | null) => {
		setSelectedPiece(id);
	}, []);

	// 現在の選択駒に対する有効な移動先を計算
	const validMoveDestinations = useMemo(() => {
		if (!selectedPiece) return [];

		// 現在のグリッド位置を特定
		const currentPos = piecePositions[selectedPiece] || gridToWorld(PIECE_INITIAL_GRID[selectedPiece].row, PIECE_INITIAL_GRID[selectedPiece].col);
		const fromGrid = worldToGrid(currentPos[0], currentPos[2]);
		if (!fromGrid) return [];

		// そのマスに現在の手番の駒があるか確認
		const piece = boardState.board[fromGrid.row][fromGrid.col];
		if (!piece || piece.color !== boardState.sideToMove) return [];

		// 合法手一覧から、移動元が一致するものを抽出
		const legalMoves = generateLegalMoves(boardState);
		return legalMoves
			.filter(m => m.type === "move" && m.from.row === fromGrid.row && m.from.col === fromGrid.col)
			.map(m => m.to);
	}, [selectedPiece, boardState, piecePositions]);

	const handleDragEnd = useCallback((id: string, newPos: [number, number, number]) => {
		const toGrid = worldToGrid(newPos[0], newPos[2]);
		if (!toGrid) return;

		const currentPos = piecePositions[id];
		let fromGrid: Square;
		if (currentPos) {
			const g = worldToGrid(currentPos[0], currentPos[2]);
			fromGrid = g!;
		} else {
			fromGrid = PIECE_INITIAL_GRID[id];
		}

		if (fromGrid.row === toGrid.row && fromGrid.col === toGrid.col) return;

		// ルールチェック (成りは一旦自動で行うか、後で行う)
		// 行き止まりになる場合は強制的に成る
		const mustPromote = (id.includes("fu") && ((boardState.sideToMove === Color.BLACK && toGrid.row === 0) || (boardState.sideToMove === Color.WHITE && toGrid.row === 4)));
		
		const move: Move = {
			type: "move",
			from: fromGrid,
			to: toGrid,
			promote: mustPromote // TODO: 選択UIが必要だが、一旦「歩」の行き止まりのみ
		};

		if (isLegalMove(boardState, move)) {
			// 捕獲される駒があるか確認
			const capturedPiece = boardState.board[toGrid.row][toGrid.col];
			const nextState = applyMove(boardState, move);
			
			setPiecePositions(prev => {
				const nextPosMap = { ...prev };
				
				// 移動させた駒の位置を更新
				nextPosMap[id] = gridToWorld(toGrid.row, toGrid.col);
				
				// もし駒を取った場合、取られた駒を駒台へ移動させる
				if (capturedPiece) {
					// 取られた駒のIDを特定（現在の位置から逆算）
					const capturedId = Object.keys(PIECE_INITIAL_GRID).find(pid => {
						if (pid === id) return false;
						const pPos = piecePositions[pid] || gridToWorld(PIECE_INITIAL_GRID[pid].row, PIECE_INITIAL_GRID[pid].col);
						const pg = worldToGrid(pPos[0], pPos[2]);
						return pg && pg.row === toGrid.row && pg.col === toGrid.col;
					});

					if (capturedId) {
						// 駒台の位置（暫定）
						// 先手が取った場合 -> 先手の駒台へ
						const isSenteWin = boardState.sideToMove === Color.BLACK;
						const handX = isSenteWin ? -12.5 : -21.2;
						const handZ = isSenteWin ? -21 : 12.7;
						// 少しずつずらす（簡易版）
						const offset = Object.keys(nextPosMap).filter(k => k === capturedId).length * 2;
						nextPosMap[capturedId] = [handX, 10.0, handZ + offset];
					}
				}
				
				return nextPosMap;
			});

			setBoardState(nextState);
			console.log(`${boardState.sideToMove === Color.BLACK ? "先手" : "後手"}の移動: ${id} (${fromGrid.row},${fromGrid.col}) -> (${toGrid.row},${toGrid.col})`);
		} else {
			console.log("無効な移動です");
		}
	}, [boardState, piecePositions]);

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

						{/* アシストマーク（移動可能な場所の強調） */}
						{validMoveDestinations.map((dest, idx) => {
							const pos = gridToWorld(dest.row, dest.col);
							return <MoveMarker key={`marker-${idx}`} position={pos} />;
						})}

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
							initialPosition={piecePositions["sente-ou"] || [-9.1, 10.0, -6.4]}
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
							initialPosition={piecePositions["sente-kin"] || [-9.1, 10.0, -3.2]}
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
							initialPosition={piecePositions["sente-fu"] || [-6, 10.0, -6.4]}
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
							initialPosition={piecePositions["gote-kin"] || [3.9, 10.0, 3.2]}
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
							initialPosition={piecePositions["gote-gin"] || [3.9, 10.0, 0]}
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
							initialPosition={piecePositions["gote-fu"] || [0.6, 10.0, 6.4]}
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
