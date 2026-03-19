// @ts-nocheck
"use client";

import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Html, useProgress } from "@react-three/drei";
import { Suspense, useRef, useState, useCallback, useEffect, useMemo } from "react";
import * as THREE from "three";
import {
	Color,
	PieceType,
	createInitialBoard,
	isLegalMove,
	applyMove,
	generateLegalMoves,
	UNPROMOTE_MAP,
	type BoardState,
	type Move,
	type Square
} from "@torassen/shogi-logic";
import { PieceData, GameState, Pos } from "@/lib/shogi/types";

const LOADER_PIECES = [
	"/models/fu.glb",
	"/models/gin.glb",
	"/models/hisya.glb",
	"/models/kaku.glb",
	"/models/kin.glb",
	"/models/ousyo_NoTen.glb"
];

function ShogiLoader() {
	const { progress } = useProgress();
	// ランダムな駒を選択
	const modelPath = useMemo(() => {
		const randomIndex = Math.floor(Math.random() * LOADER_PIECES.length);
		return LOADER_PIECES[randomIndex];
	}, []);

	const { scene } = useGLTF(modelPath);
	const pieceRef = useRef<THREE.Group>(null);
	const clonedScene = useMemo(() => scene.clone(), [scene]);

	useFrame((state) => {
		if (pieceRef.current) {
			pieceRef.current.rotation.y += 0.02;
			pieceRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.5;
		}
	});

	return (
		<group>
			{/* 中央で回転する飛車の駒 */}
			<primitive
				ref={pieceRef}
				object={clonedScene}
				scale={[3, 3, 3]}
				position={[0, 0, 0]}
				rotation={[0, 0, 0]}
			/>

			<Html center portal={undefined} distanceFactor={6} position={[0, -5, 0]}>
				<div style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "40px",
					padding: "50px 80px",
					background: "rgba(20, 15, 10, 0.8)",
					backdropFilter: "blur(12px)",
					borderRadius: "40px",
					border: "1px solid rgba(212, 175, 55, 0.3)",
					boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
					color: "#f5e6c8",
					width: "600px",
					zIndex: 1000,
					marginTop: "1000px" // 駒の下に配置
				}}>
					<div style={{
						width: "100%",
						height: "20px",
						background: "rgba(255, 255, 255, 0.05)",
						borderRadius: "10px",
						overflow: "hidden",
						border: "1px solid rgba(212, 175, 55, 0.1)"
					}}>
						<div style={{
							width: `${progress}%`,
							height: "100%",
							background: "linear-gradient(90deg, #d4af37, #f5e6c8)",
							boxShadow: "0 0 20px rgba(212, 175, 55, 0.6)",
							transition: "width 0.3s ease-out"
						}} />
					</div>
					<div style={{
						fontSize: "3.1rem",
						opacity: 0.95,
						fontWeight: 900,
						letterSpacing: "0.15em",
						fontFamily: "monospace",
						textShadow: "0 0 15px rgba(212, 175, 55, 0.3)"
					}}>
						{progress.toFixed(0)}%
					</div>
				</div>
			</Html>
		</group>
	);
}
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
	count = 1,
	onSelect,
	onDragEnd,
	parentGroupRef,
	draggable = true
}: {
	modelPath: string;
	initialPosition: [number, number, number];
	rotation: [number, number, number];
	scale?: [number, number, number];
	pieceId: string;
	selectedId: string | null;
	count?: number;
	isPromoted?: boolean;
	onSelect: (id: string | null) => void;
	onDragEnd: (id: string, newPos: [number, number, number]) => void;
	parentGroupRef: React.RefObject<THREE.Group>;
	draggable?: boolean;
}) {
	const { scene } = useGLTF(modelPath);
	const clonedScene = scene.clone();
	// 駒の全メッシュに影を落とす設定
	clonedScene.traverse((child) => {
		if ((child as THREE.Mesh).isMesh) {
			const mesh = child as THREE.Mesh;
			// モデル内に元々含まれている影用メッシュ（"shadow"など）を非表示にする
			if (mesh.name.toLowerCase().includes("shadow") || mesh.name.toLowerCase().includes("plane")) {
				mesh.visible = false;
				return;
			}
			mesh.castShadow = true;
			// 環境マップ（背景画像）からの自動ライティングを無効化して影を1つに絞る
			if (mesh.material instanceof THREE.MeshStandardMaterial) {
				mesh.material.envMapIntensity = 0;
			}
		}
	});
	const positionGroupRef = useRef<THREE.Group>(null);
	const rotationGroupRef = useRef<THREE.Group>(null);
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
	const initialPosRef = useRef<[number, number, number]>(initialPosition);

	// posRefとinitialPosRefを最新の状態に同期
	posRef.current = pos;
	initialPosRef.current = initialPosition;

	const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
		if (!draggable) return;
		e.stopPropagation();
		onSelect(pieceId);
		setIsDragging(true);
		gl.domElement.style.cursor = "grabbing";

		// 駒のワールド位置を取得してドラッグ平面を設定
		const parentGroup = parentGroupRef.current;
		if (!parentGroup || !positionGroupRef.current) return;

		// 駒のワールド位置を取得
		const worldPos = new THREE.Vector3();
		positionGroupRef.current.getWorldPosition(worldPos);

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
			// ドロップ後に位置を強制的に再同期する（無効な位置の場合は元の場所に戻る）
			// 親が piecePositions を更新していれば、その最新位置にスナップする
			setPos(initialPosRef.current);
		};

		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
	}, [pieceId, onSelect, onDragEnd, gl, camera, parentGroupRef]);

	const targetQuat = useMemo(() => {
		const q = new THREE.Quaternion();
		const e = new THREE.Euler(...rotation);
		q.setFromEuler(e);
		return q;
	}, [rotation]);

	const targetPos = useMemo(() => new THREE.Vector3(...pos), [pos]);
	const isFirstFrame = useRef(true);
	// 落下アニメーション用のランダムな初期高度
	const dropOffset = useMemo(() => Math.random() * 15 + 20, []);

	const ghostScene = useMemo(() => {
		if (!isDragging) return null;
		const s = scene.clone();
		s.traverse((child) => {
			if ((child as THREE.Mesh).isMesh) {
				const mesh = child as THREE.Mesh;
				if (mesh.name.toLowerCase().includes("shadow") || mesh.name.toLowerCase().includes("plane")) {
					mesh.visible = false;
					return;
				}
				mesh.castShadow = false;
				mesh.receiveShadow = false;
				if (mesh.material instanceof THREE.MeshStandardMaterial) {
					// 既存の素材をクローンして透明度を設定
					mesh.material = mesh.material.clone();
					mesh.material.transparent = true;
					mesh.material.opacity = 0.4;
					mesh.material.envMapIntensity = 0;
				}
			}
		});
		return s;
	}, [isDragging, scene]);

	useFrame((state, delta) => {
		if (!positionGroupRef.current || !rotationGroupRef.current) return;

		// 初回フレームは空中でスタートさせる（落下アニメーション用）
		if (isFirstFrame.current) {
			positionGroupRef.current.position.set(targetPos.x, targetPos.y + dropOffset, targetPos.z);
			rotationGroupRef.current.quaternion.copy(targetQuat);
			isFirstFrame.current = false;
			return;
		}

		// 1. 位置のアニメーション (Lerp)
		if (!isDragging) {
			const currentPos = positionGroupRef.current.position;
			currentPos.lerp(new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z), 0.2);

			// 2. 回転のアニメーション (Slerp) - 内側のグループのみ回転
			rotationGroupRef.current.quaternion.slerp(targetQuat, 0.15);
		} else {
			// ドラッグ中は即座に位置を反映
			positionGroupRef.current.position.set(pos[0], pos[1] + 1, pos[2]);
			rotationGroupRef.current.quaternion.copy(targetQuat);
		}
	});

	return (
		<group
			ref={positionGroupRef}
			onPointerDown={handlePointerDown}
			onPointerOver={() => { gl.domElement.style.cursor = "grab"; }}
			onPointerOut={() => { gl.domElement.style.cursor = "auto"; }}
		>
			{/* 選択時のハイライト（位置グループに属するため駒が回転しても水平を維持） */}
			{isSelected && (
				<mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<ringGeometry args={[1.2, 1.6, 32]} />
					<meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} />
				</mesh>
			)}
			{/* クリック用の透明ヒットエリア */}
			<mesh visible={false}>
				<boxGeometry args={[2.5, 2.5, 2.5]} />
				<meshBasicMaterial transparent opacity={0} />
			</mesh>

			{/* 回転アニメーション用の内部グループ */}
			<group ref={rotationGroupRef}>
				<primitive
					object={clonedScene}
					scale={scale}
				/>
			</group>

			{/* ドラッグ中のゴースト表示（元の位置に半透明で表示） */}
			{isDragging && ghostScene && (
				<group position={[
					initialPosition[0] - pos[0],
					initialPosition[1] - (pos[1] + 1),
					initialPosition[2] - pos[2]
				]}>
					<primitive
						object={ghostScene}
						scale={scale}
						rotation={rotation}
					/>
				</group>
			)}

			{count > 1 && (
				<Html position={[1.5, 0.5, 1.5]} center pointerEvents="none">
					<div style={{
						background: "rgba(0, 0, 0, 0.8)",
						color: "white",
						width: "24px",
						height: "24px",
						borderRadius: "50%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontSize: "14px",
						fontWeight: "bold",
						border: "2px solid #ffffff",
						userSelect: "none"
					}}>
						{count}
					</div>
				</Html>
			)}
		</group>
	);
}

function DaiModelContent({ position, rotation, scale = [1, 1, 1] }: { position: [number, number, number], rotation: [number, number, number], scale?: [number, number, number] }) {
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

// 駒の位置が盤外（駒台）かどうかを判定する
function checkIsHandPos(pos: [number, number, number]): boolean {
	// 盤の範囲 X:[3.9, -9.1] Z:[-6.4, 6.4] から外れているか判定
	return pos[0] > 5.0 || pos[0] < -10.0 || pos[2] > 7.0 || pos[2] < -7.0;
}

// 成り駒かどうかを判定（PieceType で判定）
function isPromotedPieceType(type: number): boolean {
	return type >= 6; // 0-5 は成りなし、6-9 は成り込み駒
}

// IDから基本の駒種を取得する
function getBasePieceType(id: string): PieceType {
	if (id.includes("fu")) return PieceType.PAWN;
	if (id.includes("hisya")) return PieceType.ROOK;
	if (id.includes("kaku")) return PieceType.BISHOP;
	if (id.includes("gin")) return PieceType.SILVER;
	if (id.includes("kin")) return PieceType.GOLD;
	return PieceType.KING;
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

// 駒台の座標定義
const SENTE_HAND_COORDS: Partial<Record<PieceType, [number, number, number]>> = {
	[PieceType.PAWN]: [-3, 10.0, 10.2],
	[PieceType.ROOK]: [-3, 10.0, 13.2],
	[PieceType.BISHOP]: [-3, 10.0, 16.2],
	[PieceType.SILVER]: [-7.1, 10.0, 10.2],
	[PieceType.GOLD]: [-7.1, 10.0, 13.2],
};

const GOTE_HAND_COORDS: Partial<Record<PieceType, [number, number, number]>> = {
	[PieceType.PAWN]: [-2.7, 10.0, -10.2],
	[PieceType.ROOK]: [-2.7, 10.0, -13.2],
	[PieceType.BISHOP]: [-2.7, 10.0, -16.2],
	[PieceType.SILVER]: [1.5, 10.0, -10.2],
	[PieceType.GOLD]: [1.5, 10.0, -13.2],
};

const SENTE_PIECES_CONFIG = [
	{ id: "sente-ou", model: "/models/ousyo.glb", defaultPos: [-9.1, 10.0, -6.4] as [number, number, number] },
	{ id: "sente-kin", model: "/models/kin.glb", defaultPos: [-9.1, 10.0, -3.2] as [number, number, number] },
	{ id: "sente-gin", model: "/models/gin.glb", defaultPos: [-9.1, 10.0, 0.0] as [number, number, number] },
	{ id: "sente-kaku", model: "/models/kaku.glb", defaultPos: [-9.1, 10.0, 3.2] as [number, number, number] },
	{ id: "sente-hisya", model: "/models/hisya.glb", defaultPos: [-9.1, 10.0, 6.4] as [number, number, number] },
	{ id: "sente-fu", model: "/models/fu.glb", defaultPos: [-6, 10.0, -6.4] as [number, number, number] },
];

const GOTE_PIECES_CONFIG = [
	{ id: "gote-ou", model: "/models/ousyo_NoTen.glb", defaultPos: [3.9, 10.0, 6.4] as [number, number, number] },
	{ id: "gote-kin", model: "/models/kin.glb", defaultPos: [3.9, 10.0, 3.2] as [number, number, number] },
	{ id: "gote-gin", model: "/models/gin.glb", defaultPos: [3.9, 10.0, 0] as [number, number, number] },
	{ id: "gote-kaku", model: "/models/kaku.glb", defaultPos: [3.9, 10.0, -3.2] as [number, number, number] },
	{ id: "gote-hisya", model: "/models/hisya.glb", defaultPos: [3.9, 10.0, -6.4] as [number, number, number] },
	{ id: "gote-fu", model: "/models/fu.glb", defaultPos: [0.6, 10.0, 6.4] as [number, number, number] },
];

export default function TatamiBackground({
	onTurnChange,
	onBoardMove,
	externalTurn,
	playerColor,
	lastExternalMove
}: {
	onTurnChange?: (turn: Color) => void;
	onBoardMove?: (move: Move) => void;
	externalTurn?: Color;
	playerColor?: Color;
	lastExternalMove?: Move;
}) {
	const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
	const [pendingPromotion, setPendingPromotion] = useState<{ id: string, move: Move } | null>(null);
	const boardGroupRef = useRef<THREE.Group>(null);
	const lastExternalMoveIdRef = useRef<string | null>(null);
	// 将棋の論理的な盤面状態
	const [boardState, setBoardState] = useState<BoardState>(() => createInitialBoard());

	// 各駒の現在位置（ワールド座標）を管理
	const [piecePositions, setPiecePositions] = useState<Record<string, [number, number, number]>>({});
	// 各駒の現在の所有者（先手/後手）を管理
	const [pieceOwners, setPieceOwners] = useState<Record<string, Color>>(() => {
		const initial: Record<string, Color> = {};
		Object.keys(PIECE_INITIAL_GRID).forEach(id => {
			initial[id] = id.startsWith("sente-") ? Color.BLACK : Color.WHITE;
		});
		return initial;
	});
	// 各駒の成り状態を管理
	const [piecePromotions, setPiecePromotions] = useState<Record<string, boolean>>(() => {
		const initial: Record<string, boolean> = {};
		Object.keys(PIECE_INITIAL_GRID).forEach(id => {
			initial[id] = false;
		});
		return initial;
	});







	// 3D 盤面のみを更新する関数（循環防止、または外部指し手用）
	const applyMoveTo3D = useCallback((id: string, move: Move) => {
		const toGrid = move.to;
		const capturedPiece = move.type === "move" ? boardState.board[toGrid.row][toGrid.col] : null;
		const nextState = applyMove(boardState, move);

		// 所有者の更新
		if (capturedPiece) {
			const capturedId = Object.keys(PIECE_INITIAL_GRID).find(pid => {
				if (pid === id) return false;
				const pPos = piecePositions[pid] || gridToWorld(PIECE_INITIAL_GRID[pid].row, PIECE_INITIAL_GRID[pid].col);
				if (checkIsHandPos(pPos)) return false;
				const pg = worldToGrid(pPos[0], pPos[2]);
				return pg && pg.row === toGrid.row && pg.col === toGrid.col;
			});
			if (capturedId) {
				setPieceOwners(prev => ({ ...prev, [capturedId]: boardState.sideToMove }));
				setPiecePromotions(prev => ({ ...prev, [capturedId]: false }));
			}
		}

		if (move.type === "move" && move.promote) {
			setPiecePromotions(prev => ({ ...prev, [id]: true }));
		}

		setPiecePositions(prev => {
			const nextPosMap = { ...prev };
			nextPosMap[id] = gridToWorld(toGrid.row, toGrid.col);

			if (capturedPiece) {
				const capturedId = Object.keys(PIECE_INITIAL_GRID).find(pid => {
					if (pid === id) return false;
					const pPos = prev[pid] || gridToWorld(PIECE_INITIAL_GRID[pid].row, PIECE_INITIAL_GRID[pid].col);
					if (checkIsHandPos(pPos)) return false;
					const pg = worldToGrid(pPos[0], pPos[2]);
					return pg && pg.row === toGrid.row && pg.col === toGrid.col;
				});

				if (capturedId) {
					const winnerColor = boardState.sideToMove;
					const coordsMap = winnerColor === Color.BLACK ? SENTE_HAND_COORDS : GOTE_HAND_COORDS;
					const baseType = UNPROMOTE_MAP[capturedPiece.pieceType] ?? capturedPiece.pieceType;
					nextPosMap[capturedId] = coordsMap[baseType] || [0, 0, 0];
				}
			}
			return nextPosMap;
		});

		setBoardState(nextState);
	}, [boardState, piecePositions, pieceOwners]);

	// 駒が操作可能かどうかを判定（自分の手番かつ自分の駒であること）
	const isPieceDraggable = useCallback((id: string) => {
		const owner = pieceOwners[id];
		// その駒の所有者の手番であること
		if (owner !== boardState.sideToMove) return false;
		// 自分が動かせる色であること（AI対戦やオンライン対局用）
		if (playerColor !== undefined && owner !== playerColor) return false;
		return true;
	}, [pieceOwners, boardState.sideToMove, playerColor]);

	// 指し手を実行する共通関数
	const executeMove = useCallback((id: string, move: Move) => {
		applyMoveTo3D(id, move);

		// 親コンポーネント（HUD）への通知
		const nextSide = (boardState.sideToMove === Color.BLACK) ? Color.WHITE : Color.BLACK;
		if (onTurnChange) onTurnChange(nextSide);
		if (onBoardMove) onBoardMove(move);

		console.log(`[3D] アクション実行: ${id}`);
	}, [boardState, applyMoveTo3D, onTurnChange, onBoardMove]);

	// 外部からの手番同期（HUDとの同期用）
	useEffect(() => {
		if (externalTurn !== undefined && externalTurn !== boardState.sideToMove) {
			setBoardState(prev => ({ ...prev, sideToMove: externalTurn }));
		}
	}, [externalTurn, boardState.sideToMove]);

	// 外部からの指し手を 3D 盤面に反映
	useEffect(() => {
		if (!lastExternalMove) return;

		// Move オブジェクトの一致を簡易的に判定（JSON化またはID付与が理想だが、ここでは内容で判定）
		const moveHash = JSON.stringify(lastExternalMove);
		if (lastExternalMoveIdRef.current === moveHash) return;
		lastExternalMoveIdRef.current = moveHash;

		let targetId: string | null = null;
		const move = lastExternalMove;

		if (move.type === "move") {
			// 盤上移動の場合: move.from にある駒を探す
			targetId = Object.keys(PIECE_INITIAL_GRID).find(id => {
				const pos = piecePositions[id] || gridToWorld(PIECE_INITIAL_GRID[id].row, PIECE_INITIAL_GRID[id].col);
				if (checkIsHandPos(pos)) return false;
				const grid = worldToGrid(pos[0], pos[2]);
				return grid && grid.row === move.from.row && grid.col === move.from.col;
			}) || null;
		} else if (move.type === "drop") {
			// 打ち込みの場合: 現在の手番의持ち駒の中から同じ種類かつ駒台にあるものを探す
			const owner = boardState.sideToMove;
			targetId = Object.keys(PIECE_INITIAL_GRID).find(id => {
				const pos = piecePositions[id] || gridToWorld(PIECE_INITIAL_GRID[id].row, PIECE_INITIAL_GRID[id].col);
				return checkIsHandPos(pos) && pieceOwners[id] === owner && getBasePieceType(id) === move.pieceType;
			}) || null;
		}

		if (targetId) {
			// 外部指し手を適用（親への通知は不要）
			applyMoveTo3D(targetId, move);
		}
	}, [lastExternalMove, piecePositions, pieceOwners, boardState.sideToMove, applyMoveTo3D]);

	// 駒の向きを計算するヘルパー
	const getPieceRotation = (id: string, color: Color, isPromoted: boolean): [number, number, number] => {
		const isSente = color === Color.BLACK;
		const isFu = id.includes("fu");
		let rotation: [number, number, number];
		// 歩兵(fu.glb)だけモデルの基本向きが違うため調整
		if (isFu) {
			rotation = isSente ? [Math.PI / 2, 0, -Math.PI / 2] : [-Math.PI / 2, Math.PI, -Math.PI / 2];
		} else {
			rotation = isSente ? [-Math.PI / 2, 0, -Math.PI / 2] : [Math.PI / 2, Math.PI, -Math.PI / 2];
		}

		// 成っている場合は裏返しにする(X軸180度回転)
		if (isPromoted) {
			return [rotation[0] + Math.PI, rotation[1], rotation[2]];
		}
		return rotation;
	};

	// 駒が成っているか確認する
	const isPiecePromoted = useCallback((id: string): boolean => {
		return piecePromotions[id] || false;
	}, [piecePromotions]);

	const handleSelect = useCallback((id: string | null) => {
		setSelectedPiece(id);
	}, []);

	// IDから現在の持ち駒の個数を取得する
	const getHandPieceCount = useCallback((id: string): number => {
		const pos = piecePositions[id] || gridToWorld(PIECE_INITIAL_GRID[id].row, PIECE_INITIAL_GRID[id].col);
		if (!checkIsHandPos(pos)) return 1;

		const owner = pieceOwners[id];
		const type = getBasePieceType(id);
		return boardState.hands[owner][type] || 0;
	}, [piecePositions, pieceOwners, boardState.hands]);

	// その持ち駒の種類の中で、表示されるべき代表駒かどうかを判定（重複表示防止）
	const isPrimaryHandPiece = useCallback((id: string): boolean => {
		const pos = piecePositions[id] || gridToWorld(PIECE_INITIAL_GRID[id].row, PIECE_INITIAL_GRID[id].col);
		if (!checkIsHandPos(pos)) return true;

		const owner = pieceOwners[id];
		const type = getBasePieceType(id);
		// 同じ種類かつ同じ所有者の駒リストを取得
		const sameTypeIds = Object.keys(PIECE_INITIAL_GRID).filter(pid => {
			const pPos = piecePositions[pid] || gridToWorld(PIECE_INITIAL_GRID[pid].row, PIECE_INITIAL_GRID[pid].col);
			return checkIsHandPos(pPos) && pieceOwners[pid] === owner && getBasePieceType(pid) === type;
		});
		// リストの先頭のIDだけを代表とする
		return sameTypeIds[0] === id;
	}, [piecePositions, pieceOwners]);

	// 現在の選択駒に対する有効な移動先を計算
	const validMoveDestinations = useMemo(() => {
		if (!selectedPiece) return [];

		// 現在のグリッド位置を特定
		const currentPos = piecePositions[selectedPiece] || gridToWorld(PIECE_INITIAL_GRID[selectedPiece].row, PIECE_INITIAL_GRID[selectedPiece].col);
		const isHand = checkIsHandPos(currentPos);
		const fromGrid = worldToGrid(currentPos[0], currentPos[2]);
		if (!fromGrid && !isHand) return [];

		// そのマスに現在の手番の駒があるか確認（駒台の場合は所有者を確認）
		if (pieceOwners[selectedPiece] !== boardState.sideToMove) return [];

		// 合法手一覧から抽出
		const legalMoves = generateLegalMoves(boardState);

		if (isHand) {
			const type = getBasePieceType(selectedPiece);
			return legalMoves
				.filter(m => m.type === "drop" && m.pieceType === type)
				.map(m => m.to);
		} else {
			return legalMoves
				.filter(m => m.type === "move" && fromGrid && m.from.row === fromGrid.row && m.from.col === fromGrid.col)
				.map(m => m.to);
		}
	}, [selectedPiece, boardState, piecePositions, pieceOwners]);

	const handleDragEnd = useCallback((id: string, newPos: [number, number, number]) => {
		const toGrid = worldToGrid(newPos[0], newPos[2]);
		if (!toGrid) return;

		const currentPos = piecePositions[id] || gridToWorld(PIECE_INITIAL_GRID[id].row, PIECE_INITIAL_GRID[id].col);
		const isFromHand = checkIsHandPos(currentPos);

		let move: Move;

		if (isFromHand) {
			// 持ち駒を打つ
			move = {
				type: "drop",
				pieceType: getBasePieceType(id),
				to: toGrid
			};
		} else {
			// 盤上の移動
			const fromGrid = worldToGrid(currentPos[0], currentPos[2]);
			if (fromGrid.row === toGrid.row && fromGrid.col === toGrid.col) return;

			// 成り判定: 敵陣（1段目/5段目）に入る、または敵陣内から移動する場合
			const promoRank = boardState.sideToMove === Color.BLACK ? 0 : 4;
			const isToEnemyTerritory = toGrid.row === promoRank;
			const isFromEnemyTerritory = fromGrid.row === promoRank;
			const isEnemyTerritoryMove = isToEnemyTerritory || isFromEnemyTerritory;

			const canPromote = (id.includes("fu") || id.includes("gin") || id.includes("hisya") || id.includes("kaku"));

			// 既に成っている駒は promote: false (shogi-logicの仕様に合わせる)
			const promote = canPromote && isEnemyTerritoryMove && !isPiecePromoted(id);

			move = {
				type: "move",
				from: fromGrid,
				to: toGrid,
				promote: promote
			};
		}

		if (isLegalMove(boardState, move)) {
			if (move.type === "move") {
				// 成り選択のプロンプトが必要か再判定
				const promoRank = boardState.sideToMove === Color.BLACK ? 0 : 4;
				const isToEnemyTerritory = toGrid.row === promoRank;
				const isFromEnemyTerritory = move.from.row === promoRank;
				const isEnemyTerritoryMove = isToEnemyTerritory || isFromEnemyTerritory;

				const isAlreadyPromoted = isPiecePromoted(id);
				const canPromote = (id.includes("fu") || id.includes("gin") || id.includes("hisya") || id.includes("kaku")) && !isAlreadyPromoted;

				if (canPromote && isEnemyTerritoryMove) {
					if (id.includes("fu")) {
						// 歩は強制成り
						executeMove(id, { ...move, promote: true });
					} else {
						// 移動先に駒があるか確認し、あれば先に駒取りだけ視覚的に行う
						const toGrid = move.to;
						const capturedPiece = boardState.board[toGrid.row][toGrid.col];
						if (capturedPiece) {
							const capturedId = Object.keys(PIECE_INITIAL_GRID).find(pid => {
								if (pid === id) return false;
								const pPos = piecePositions[pid] || gridToWorld(PIECE_INITIAL_GRID[pid].row, PIECE_INITIAL_GRID[pid].col);
								if (checkIsHandPos(pPos)) return false;
								const pg = worldToGrid(pPos[0], pPos[2]);
								return pg && pg.row === toGrid.row && pg.col === toGrid.col;
							});
							if (capturedId) {
								setPieceOwners(prev => ({ ...prev, [capturedId]: boardState.sideToMove }));
								setPiecePromotions(prev => ({ ...prev, [capturedId]: false }));
								setPiecePositions(prev => {
									const winnerColor = boardState.sideToMove;
									const coordsMap = winnerColor === Color.BLACK ? SENTE_HAND_COORDS : GOTE_HAND_COORDS;
									const baseType = UNPROMOTE_MAP[capturedPiece.pieceType] ?? capturedPiece.pieceType;
									const capturedHandPos = coordsMap[baseType] || [0, 0, 0];
									return { ...prev, [capturedId]: capturedHandPos, [id]: gridToWorld(toGrid.row, toGrid.col) };
								});
							} else {
								// 駒取りがない場合でも駒を移動先に進める
								setPiecePositions(prev => ({ ...prev, [id]: gridToWorld(toGrid.row, toGrid.col) }));
							}
						} else {
							// 駒がない場所への移動
							setPiecePositions(prev => ({ ...prev, [id]: gridToWorld(toGrid.row, toGrid.col) }));
						}

						// それ以外は選択
						setPendingPromotion({ id, move: move as BoardMove });
					}
				} else {
					executeMove(id, move);
				}
			} else {
				executeMove(id, move);
			}
		} else {
			console.log("無効な移動です");
		}
	}, [boardState, piecePositions, executeMove, isPiecePromoted]);

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
				<Suspense fallback={<ShogiLoader />}>
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
						{SENTE_PIECES_CONFIG.map(piece => isPrimaryHandPiece(piece.id) && (
							<DraggablePiece
								key={piece.id}
								pieceId={piece.id}
								modelPath={piece.model}
								initialPosition={piecePositions[piece.id] || piece.defaultPos}
								rotation={getPieceRotation(piece.id, pieceOwners[piece.id], isPiecePromoted(piece.id))}
								count={getHandPieceCount(piece.id)}
								selectedId={selectedPiece}
								isPromoted={isPiecePromoted(piece.id)}
								onSelect={handleSelect}
								onDragEnd={handleDragEnd}
								parentGroupRef={boardGroupRef}
								draggable={isPieceDraggable(piece.id)}
							/>
						))}

						{/* === 後手の駒 === */}
						{GOTE_PIECES_CONFIG.map(piece => isPrimaryHandPiece(piece.id) && (
							<DraggablePiece
								key={piece.id}
								pieceId={piece.id}
								modelPath={piece.model}
								initialPosition={piecePositions[piece.id] || piece.defaultPos}
								rotation={getPieceRotation(piece.id, pieceOwners[piece.id], isPiecePromoted(piece.id))}
								count={getHandPieceCount(piece.id)}
								selectedId={selectedPiece}
								isPromoted={isPiecePromoted(piece.id)}
								onSelect={handleSelect}
								onDragEnd={handleDragEnd}
								parentGroupRef={boardGroupRef}
								draggable={isPieceDraggable(piece.id)}
							/>
						))}
					</group>

					<Environment preset="sunset" />
				</Suspense>
			</Canvas>

			{/* 成り選択UI */}
			{pendingPromotion && (
				<div style={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					zIndex: 1000,
					background: "rgba(255, 255, 255, 0.1)",
					backdropFilter: "blur(20px)",
					border: "1px solid rgba(255, 255, 255, 0.2)",
					padding: "40px",
					borderRadius: "32px",
					boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
					textAlign: "center",
					minWidth: "300px",
					color: "white",
					animation: "fadeIn 0.3s ease-out"
				}}>
					<h2 style={{
						margin: "0 0 30px 0",
						fontSize: "24px",
						fontWeight: "light",
						letterSpacing: "0.1em",
						textTransform: "uppercase"
					}}>成りますか？</h2>
					<div style={{
						display: "flex",
						gap: "20px",
						justifyContent: "center"
					}}>
						<button
							onClick={() => {
								executeMove(pendingPromotion.id, { ...pendingPromotion.move, promote: true });
								setPendingPromotion(null);
							}}
							style={{
								padding: "16px 32px",
								fontSize: "18px",
								borderRadius: "16px",
								border: "none",
								background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
								color: "white",
								cursor: "pointer",
								boxShadow: "0 10px 15px -3px rgba(239, 68, 68, 0.3)",
								transition: "transform 0.2s, box-shadow 0.2s"
							}}
							onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
							onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
						>
							成る
						</button>
						<button
							onClick={() => {
								executeMove(pendingPromotion.id, { ...pendingPromotion.move, promote: false });
								setPendingPromotion(null);
							}}
							style={{
								padding: "16px 32px",
								fontSize: "18px",
								borderRadius: "16px",
								border: "none",
								background: "rgba(255, 255, 255, 0.15)",
								color: "white",
								cursor: "pointer",
								transition: "background 0.2s, transform 0.2s"
							}}
							onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)"; }}
							onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"; }}
						>
							成らない
						</button>
					</div>
					<style dangerouslySetInnerHTML={{
						__html: `
						@keyframes fadeIn {
							from { opacity: 0; transform: translate(-50%, -40%); }
							to { opacity: 1; transform: translate(-50%, -50%); }
						}
					`}} />
				</div>
			)}
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
