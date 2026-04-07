// @ts-nocheck
"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Suspense, useRef, useState, useCallback, useEffect, useMemo } from "react";
import * as THREE from "three";
import {
	Color,
	isLegalMove,
	applyMove,
	generateLegalMoves,
	UNPROMOTE_MAP,
	type BoardState,
	type Move,
	gridToWorld,
	worldToGrid,
	checkIsHandPos,
	SENTE_HAND_COORDS,
	GOTE_HAND_COORDS,
	getBasePieceType,
	getPieceRotation,
	getGridFromBoardState,
	getInitialDataFromBoardState,
	PType,
	MODEL,
	Pos
} from "@torassen/shogi-logic";
import ShogiLoader from "./ShogiLoader";
import DraggablePiece from "./PieceDisplay/DraggablePiece";
import Background from "./Background/Background";
import PromotionButton from "./Button/Promotion";
import MoveMarker from "./MoveMarker";

const LOADER_PIECES = [
	"/models/fu.glb",
	"/models/gin.glb",
	"/models/hisya.glb",
	"/models/kaku.glb",
	"/models/kin.glb",
	"/models/ousyo_NoTen.glb"
];

function LoadingEventTrigger({ onLoaded, isPreparing }: { onLoaded?: () => void, isPreparing: boolean }) {
	useEffect(() => {
		if (!isPreparing) {
			onLoaded?.();
		}
	}, [onLoaded, isPreparing]);
	return null;
}

export default function TatamiBackground({
	state,
	onTurnChange,
	onBoardMove,
	externalTurn,
	playerColor,
	lastExternalMove,
	isGameOver = false,
	isPreparing = false,
	onLoaded
}: {
	state: BoardState
	onTurnChange?: (turn: Color) => void;
	onBoardMove?: (move: Move) => void;
	onLoaded?: () => void;
	externalTurn?: Color;
	playerColor?: Color;
	lastExternalMove?: Move;
	isGameOver?: boolean;
	isPreparing?: boolean;
}) {
	const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
	const [pendingPromotion, setPendingPromotion] = useState<{ id: string, move: Move } | null>(null);
	const boardGroupRef = useRef<THREE.Group>(null);
	const lastExternalMoveIdRef = useRef<string | null>(null);
	// 将棋の論理的な盤面状態
	const [boardState, setBoardState] = useState<BoardState>(state);
	const [initialGrid, setInitialGrid] = useState<Record<string, Pos>>(getGridFromBoardState(state));

	useEffect(() => {
		setBoardState(state);
		setInitialGrid(getGridFromBoardState(state));
	}, [state])

	const isFlipped = useMemo(() => playerColor === Color.WHITE, [playerColor]);

	const [pieceId, setPieceId] = useState<string[]>([]);
	const [piecePositions, setPiecePositions] = useState<Record<string, [number, number, number]>>();
	const [pieceOwners, setPieceOwners] = useState<Record<string, Color>>();
	const [piecePromotions, setPiecePromotions] = useState<Record<string, boolean>>();

	useEffect(() => {
		const { positions, owners, promotions } = getInitialDataFromBoardState(boardState, isFlipped);
		setPiecePositions(positions);
		setPieceOwners(owners);
		setPiecePromotions(promotions);
		setPieceId(Object.keys(positions));
	}, [initialGrid]);

	// 盤面の向き：自分が後手(White)の場合は論理的な座標を反転させる


	// 3D 盤面のみを更新する関数（循環防止、または外部指し手用）
	const applyMoveTo3D = useCallback((id: string, move: Move) => {
		const toGrid = move.to;
		const capturedPiece = move.type === "move" ? boardState.board[toGrid.row][toGrid.col] : null;
		const nextState = applyMove(boardState, move);

		// 所有者の更新
		if (capturedPiece) {
			const capturedId = Object.keys(initialGrid).find(pid => {
				if (pid === id) return false;
				const pPos = piecePositions[pid] || gridToWorld(initialGrid[pid].row, initialGrid[pid].col, isFlipped);
				if (checkIsHandPos(pPos)) return false;
				const pg = worldToGrid(pPos[0], pPos[2], isFlipped);
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
			nextPosMap[id] = gridToWorld(toGrid.row, toGrid.col, isFlipped);

			if (capturedPiece) {
				const capturedId = Object.keys(initialGrid).find(pid => {
					if (pid === id) return false;
					const pPos = prev[pid] || gridToWorld(initialGrid[pid].row, initialGrid[pid].col, isFlipped);
					if (checkIsHandPos(pPos)) return false;
					const pg = worldToGrid(pPos[0], pPos[2], isFlipped);
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
	}, [boardState, piecePositions, pieceOwners, isFlipped]);

	// 駒が操作可能かどうかを判定（自分の手番かつ自分の駒であること）
	const isPieceDraggable = useCallback((id: string) => {
		if (playerColor === undefined) return false;
		// 終局している場合は操作不可
		if (isGameOver) return false;

		const owner = pieceOwners[id];
		// その駒の所有者の手番であること
		if (owner !== boardState.sideToMove) return false;
		// 自分が動かせる色であること（AI対戦やオンライン対局用）
		if (playerColor !== undefined && owner !== playerColor) return false;
		return true;
	}, [pieceOwners, boardState.sideToMove, playerColor, isGameOver]);

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
			targetId = Object.keys(initialGrid).find(id => {
				const pos = piecePositions[id] || gridToWorld(initialGrid[id].row, initialGrid[id].col, isFlipped);
				if (checkIsHandPos(pos)) return false;
				const grid = worldToGrid(pos[0], pos[2], isFlipped);
				return grid && grid.row === move.from.row && grid.col === move.from.col;
			}) || null;
		} else if (move.type === "drop") {
			// 打ち込みの場合: 現在の手番의持ち駒の中から同じ種類かつ駒台にあるものを探す
			const owner = boardState.sideToMove;
			targetId = Object.keys(initialGrid).find(id => {
				const pos = piecePositions[id] || gridToWorld(initialGrid[id].row, initialGrid[id].col, isFlipped);
				return checkIsHandPos(pos) && pieceOwners[id] === owner && getBasePieceType(id) === move.pieceType;

			}) || null;
		}

		if (targetId) {
			// 外部指し手を適用（親への通知は不要）
			applyMoveTo3D(targetId, move);
		}
	}, [lastExternalMove, piecePositions, pieceOwners, boardState.sideToMove, applyMoveTo3D]);

	// 駒が成っているか確認する
	const isPiecePromoted = useCallback((id: string): boolean => {
		return piecePromotions[id] || false;
	}, [piecePromotions]);

	const handleSelect = useCallback((id: string | null) => {
		setSelectedPiece(id);
	}, []);

	// IDから現在の持ち駒の個数を取得する
	const getHandPieceCount = useCallback((id: string): number => {
		const pos = piecePositions[id] || gridToWorld(initialGrid[id].row, initialGrid[id].col);
		if (!checkIsHandPos(pos)) return 1;

		const owner = pieceOwners[id];
		const type = getBasePieceType(id);
		return boardState.hands[owner][type] || 0;
	}, [piecePositions, pieceOwners, boardState.hands]);

	// その持ち駒の種類の中で、表示されるべき代表駒かどうかを判定（重複表示防止）
	const isPrimaryHandPiece = useCallback((id: string): boolean => {
		const pos = piecePositions[id] || gridToWorld(initialGrid[id].row, initialGrid[id].col, isFlipped);
		if (!checkIsHandPos(pos)) return true;

		const owner = pieceOwners[id];
		const type = getBasePieceType(id);
		// 同じ種類かつ同じ所有者の駒リストを取得
		const sameTypeIds = Object.keys(initialGrid).filter(pid => {
			const pPos = piecePositions[pid] || gridToWorld(initialGrid[pid].row, initialGrid[pid].col, isFlipped);
			return checkIsHandPos(pPos) && pieceOwners[pid] === owner && getBasePieceType(pid) === type;
		});
		// リストの先頭のIDだけを代表とする
		return sameTypeIds[0] === id;
	}, [piecePositions, pieceOwners, isFlipped]);

	// 現在の選択駒に対する有効な移動先を計算
	const validMoveDestinations = useMemo(() => {
		if (!selectedPiece) return [];

		// 現在のグリッド位置を特定
		const currentPos = piecePositions[selectedPiece] || gridToWorld(initialGrid[selectedPiece].row, initialGrid[selectedPiece].col, isFlipped);
		const isHand = checkIsHandPos(currentPos);
		const fromGrid = worldToGrid(currentPos[0], currentPos[2], isFlipped);
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
	}, [selectedPiece, boardState, piecePositions, pieceOwners, isFlipped, initialGrid]);

	const handleDragEnd = useCallback((id: string, newPos: [number, number, number]) => {
		const toGrid = worldToGrid(newPos[0], newPos[2], isFlipped);
		if (!toGrid) return;

		const currentPos = piecePositions[id] || gridToWorld(initialGrid[id].row, initialGrid[id].col, isFlipped);
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
			const fromGrid = worldToGrid(currentPos[0], currentPos[2], isFlipped);
			if (fromGrid.row === toGrid.row && fromGrid.col === toGrid.col) return;

			// 成り判定: 敵陣（1段目/5段目）に入る、または敵陣内から移動する場合
			const promoRank = boardState.sideToMove === Color.BLACK ? 0 : 4;
			const isToEnemyTerritory = toGrid.row === promoRank;
			const isFromEnemyTerritory = fromGrid.row === promoRank;
			const isEnemyTerritoryMove = isToEnemyTerritory || isFromEnemyTerritory;

			const canPromote = (id.includes("PAWN") || id.includes("SILVER") || id.includes("ROOK") || id.includes("BISHOP"));

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
				const canPromote = (id.includes("PAWN") || id.includes("SILVER") || id.includes("ROOK") || id.includes("BISHOP")) && !isAlreadyPromoted;

				if (canPromote && isEnemyTerritoryMove) {
					if (id.includes("PAWN")) {
						// 歩は強制成り
						executeMove(id, { ...move, promote: true });
					} else {
						// 移動先に駒があるか確認し、あれば先に駒取りだけ視覚的に行う
						const toGrid = move.to;
						const capturedPiece = boardState.board[toGrid.row][toGrid.col];
						if (capturedPiece) {
							const capturedId = Object.keys(initialGrid).find(pid => {
								if (pid === id) return false;
								const pPos = piecePositions[pid] || gridToWorld(initialGrid[pid].row, initialGrid[pid].col, isFlipped);
								if (checkIsHandPos(pPos)) return false;
								const pg = worldToGrid(pPos[0], pPos[2], isFlipped);
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
									return { ...prev, [capturedId]: capturedHandPos, [id]: gridToWorld(toGrid.row, toGrid.col, isFlipped) };
								});
							} else {
								// 駒取りがない場合でも駒を移動先に進める
								setPiecePositions(prev => ({ ...prev, [id]: gridToWorld(toGrid.row, toGrid.col, isFlipped) }));
							}
						} else {
							// 駒がない場所への移動
							setPiecePositions(prev => ({ ...prev, [id]: gridToWorld(toGrid.row, toGrid.col, isFlipped) }));
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
	}, [boardState, piecePositions, executeMove, isPiecePromoted, isFlipped, initialGrid]);

	// 背景クリックで選択解除
	const handleBackgroundClick = useCallback(() => {
		setSelectedPiece(null);
	}, []);

	const getModel = (id: string): string => {
		const parts = id.split("-");
		const side = parts[0];     // "sente" or "gote"
		const typeName = parts[1]; // "PAWN", "KING", "PRO_PAWN" など

		if (side === "sente" && typeName === "KING") {
			return "/models/ousyo_NoTen.glb";
		}
		const pTypeKey = (PType as any)[typeName];
		const modelPath = MODEL[pTypeKey as PType];

		return modelPath || "/models/fu.glb";
	};

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
					<LoadingEventTrigger onLoaded={onLoaded} isPreparing={isPreparing} />
					{isPreparing ? (
						<ShogiLoader />
					) : (
						<>
							<Background isFlipped={isFlipped} boardGroupRef={boardGroupRef} />
							{/* 盤と駒を同じグループに入れて一括で傾ける */}
							<group ref={boardGroupRef} position={[0, -0.9, 0]} rotation={[(Math.PI / 180) * 30, Math.PI / 2, 0]}>
								{/* 背景クリックで選択解除用の透明な平面 */}
								<mesh position={[0, 9.9, 0]} rotation={[-Math.PI / 2, 0, 0]} onClick={handleBackgroundClick} receiveShadow>
									<planeGeometry args={[70, 70]} />
									<shadowMaterial transparent opacity={0.4} />
								</mesh>

								{/* アシストマーク（移動可能な場所の強調） */}
								<MoveMarker validMoveDestinations={validMoveDestinations} isFlipped={isFlipped} />

								{pieceId.map(id => isPrimaryHandPiece(id) && (
									<DraggablePiece
										key={id}
										pieceId={id}
										modelPath={getModel(id)}
										initialPosition={piecePositions[id] || gridToWorld(PIECE_INITIAL_GRID[id].row, PIECE_INITIAL_GRID[id].col, isFlipped)}
										rotation={getPieceRotation(id, pieceOwners[id], isPiecePromoted(id), isFlipped)}
										count={getHandPieceCount(id)}
										selectedId={selectedPiece}
										isPromoted={isPiecePromoted(id)}
										onSelect={handleSelect}
										onDragEnd={handleDragEnd}
										parentGroupRef={boardGroupRef}
										draggable={isPieceDraggable(id)}
									/>
								))}
							</group>
						</>
					)}
				</Suspense>
			</Canvas>

			{/* 成り選択UI */}
			{pendingPromotion &&
				<PromotionButton
					pendingPromotion={pendingPromotion}
					setPendingPromotion={setPendingPromotion}
					executeMove={executeMove}
				/>
			}
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


