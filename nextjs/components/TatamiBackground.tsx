// @ts-nocheck
"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF, Environment, Html } from "@react-three/drei";
import { Suspense, useRef, useState, useCallback, useEffect, useMemo } from "react";
import * as THREE from "three";
import {
    Color,
    isLegalMove,
    generateLegalMoves,
    type BoardState,
    type Move,
    PIECE_INITIAL_GRID,
    SENTE_PIECES_CONFIG,
    GOTE_PIECES_CONFIG,
    gridToWorld,    // これらもパッケージ内にある
    worldToGrid, 
    checkIsHandPos, 
    getBasePieceType,
    getPieceRotation 
} from "@torassen/shogi-logic";
import { useShogiBoard3D } from "@/hooks/useShogiBoard3D";
import TatamiModel from "./Background/TatamiModel";
import BanModelContent from "./Background/BanModel";
import DaiModelContent from "./Background/DaiModel";
import DraggablePiece from "./DraggablePiece";
import ShogiLoader from "./ShogiLoader";

// 外部イベント通知用
function LoadingEventTrigger({ onLoaded, isPreparing }: { onLoaded?: () => void, isPreparing: boolean }) {
    useEffect(() => {
        if (!isPreparing) onLoaded?.();
    }, [onLoaded, isPreparing]);
    return null;
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
}: any) {
    const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
    const [pendingPromotion, setPendingPromotion] = useState<any>(null);
    const boardGroupRef = useRef<THREE.Group>(null);
    const lastExternalMoveIdRef = useRef<string | null>(null);

    // 視点の反転設定
    const isFlipped = useMemo(() => playerColor === Color.WHITE, [playerColor]);

    // --- ロジックをフックに委譲 ---
    const {
        boardState,
        piecePositions,
        pieceOwners,
        piecePromotions,
        executeMove,
        setBoardState,
        applyMoveTo3D
    } = useShogiBoard3D({
        initialState: state,
        isFlipped,
        onTurnChange,
        onBoardMove
    });

    // 外部からの手番同期
    useEffect(() => {
        if (externalTurn !== undefined && externalTurn !== boardState.sideToMove) {
            setBoardState(prev => ({ ...prev, sideToMove: externalTurn }));
        }
    }, [externalTurn, boardState.sideToMove]);

    // 外部からの指し手を反映
    useEffect(() => {
        if (!lastExternalMove) return;
        const moveHash = JSON.stringify(lastExternalMove);
        if (lastExternalMoveIdRef.current === moveHash) return;
        lastExternalMoveIdRef.current = moveHash;

        let targetId: string | null = null;
        if (lastExternalMove.type === "move") {
            targetId = Object.keys(PIECE_INITIAL_GRID).find(id => {
                const pos = piecePositions[id] || gridToWorld(PIECE_INITIAL_GRID[id].row, PIECE_INITIAL_GRID[id].col, isFlipped);
                if (checkIsHandPos(pos)) return false;
                const grid = worldToGrid(pos[0], pos[2], isFlipped);
                return grid && grid.row === lastExternalMove.from.row && grid.col === lastExternalMove.from.col;
            }) || null;
        } else if (lastExternalMove.type === "drop") {
            targetId = Object.keys(PIECE_INITIAL_GRID).find(id => {
                const pos = piecePositions[id] || gridToWorld(PIECE_INITIAL_GRID[id].row, PIECE_INITIAL_GRID[id].col, isFlipped);
                return checkIsHandPos(pos) && pieceOwners[id] === boardState.sideToMove && getBasePieceType(id) === lastExternalMove.pieceType;
            }) || null;
        }
        if (targetId) applyMoveTo3D(targetId, lastExternalMove);
    }, [lastExternalMove, piecePositions, pieceOwners, boardState.sideToMove, applyMoveTo3D, isFlipped]);

    const handleDragEnd = useCallback((id: string, newPos: [number, number, number]) => {
        const toGrid = worldToGrid(newPos[0], newPos[2], isFlipped);
        if (!toGrid) return;

        const currentPos = piecePositions[id] || gridToWorld(PIECE_INITIAL_GRID[id].row, PIECE_INITIAL_GRID[id].col, isFlipped);
        const isFromHand = checkIsHandPos(currentPos);

        let move: Move;
        if (isFromHand) {
            move = { type: "drop", pieceType: getBasePieceType(id), to: toGrid };
        } else {
            const fromGrid = worldToGrid(currentPos[0], currentPos[2], isFlipped);
            if (!fromGrid || (fromGrid.row === toGrid.row && fromGrid.col === toGrid.col)) return;

            const promoRank = boardState.sideToMove === Color.BLACK ? 0 : 4;
            const canPromote = ["fu", "gin", "hisya", "kaku"].some(t => id.includes(t)) && !piecePromotions[id];
            const isEnemyTerritoryMove = toGrid.row === promoRank || fromGrid.row === promoRank;

            move = { type: "move", from: fromGrid, to: toGrid, promote: canPromote && isEnemyTerritoryMove };
        }

        if (isLegalMove(boardState, move)) {
            // 成り選択（歩以外）
            if (move.type === "move" && move.promote && !id.includes("fu")) {
                setPendingPromotion({ id, move });
            } else {
                executeMove(id, move);
            }
        }
    }, [boardState, piecePositions, piecePromotions, isFlipped, executeMove]);

    // 有効な移動先ガイド
    const validMoveDestinations = useMemo(() => {
        if (!selectedPiece || pieceOwners[selectedPiece] !== boardState.sideToMove) return [];
        const currentPos = piecePositions[selectedPiece] || gridToWorld(PIECE_INITIAL_GRID[selectedPiece].row, PIECE_INITIAL_GRID[selectedPiece].col, isFlipped);
        const isHand = checkIsHandPos(currentPos);
        const fromGrid = worldToGrid(currentPos[0], currentPos[2], isFlipped);
        
        const legalMoves = generateLegalMoves(boardState);
        return legalMoves.filter(m => {
            if (isHand) return m.type === "drop" && m.pieceType === getBasePieceType(selectedPiece);
            return m.type === "move" && fromGrid && m.from.row === fromGrid.row && m.from.col === fromGrid.col;
        }).map(m => m.to);
    }, [selectedPiece, boardState, piecePositions, pieceOwners, isFlipped]);

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 1, background: "linear-gradient(#1a1a2e, #0f0f1c)" }}>
            <Canvas shadows camera={{ position: [0, 20, 30], fov: 50 }}>
                <ambientLight intensity={0.4} />
                <directionalLight position={[0, 30, 0]} intensity={1.8} castShadow shadow-bias={-0.001} />
                <Suspense fallback={<ShogiLoader />}>
                    <LoadingEventTrigger onLoaded={onLoaded} isPreparing={isPreparing} />
                    {!isPreparing && (
                        <>
                            <TatamiModel />
                            <group ref={boardGroupRef} position={[0, -0.9, 0]} rotation={[Math.PI / 6, Math.PI / 2, 0]}>
                                <mesh position={[0, 9.9, 0]} rotation={[-Math.PI / 2, 0, 0]} onClick={() => setSelectedPiece(null)}>
                                    <planeGeometry args={[70, 70]} />
                                    <shadowMaterial transparent opacity={0.4} />
                                </mesh>
                                <BanModelContent />
                                {validMoveDestinations.map((dest, i) => (
                                    <MoveMarker key={i} position={gridToWorld(dest.row, dest.col, isFlipped)} />
                                ))}
                                <DaiModelContent position={isFlipped ? [-21.2, 0, 12.7] : [-12.5, 0, -21]} />
                                <DaiModelContent position={isFlipped ? [-12.5, 0, -21] : [-21.2, 0, 12.7]} />
                                
                                {[...SENTE_PIECES_CONFIG, ...GOTE_PIECES_CONFIG].map(p => {
                                    // 持ち駒の代表駒判定ロジックはフック側で整理するのが理想だが、一旦簡易的に表示
                                    // ※本来は isPrimaryHandPiece のチェックが必要
                                    return (
                                        <DraggablePiece
                                            key={p.id}
                                            pieceId={p.id}
                                            modelPath={p.model}
                                            initialPosition={piecePositions[p.id] || gridToWorld(PIECE_INITIAL_GRID[p.id].row, PIECE_INITIAL_GRID[p.id].col, isFlipped)}
                                            rotation={getPieceRotation(p.id, pieceOwners[p.id], piecePromotions[p.id], isFlipped)}
                                            selectedId={selectedPiece}
                                            onSelect={setSelectedPiece}
                                            onDragEnd={handleDragEnd}
                                            parentGroupRef={boardGroupRef}
                                            draggable={!isGameOver && pieceOwners[p.id] === boardState.sideToMove}
                                        />
                                    );
                                })}
                            </group>
                            <Environment preset="sunset" />
                        </>
                    )}
                </Suspense>
            </Canvas>

            {pendingPromotion && (
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1000, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", padding: "40px", borderRadius: "32px", color: "white", textAlign: "center" }}>
                    <h2 style={{ marginBottom: "30px" }}>成りますか？</h2>
                    <div style={{ display: "flex", gap: "20px" }}>
                        <button onClick={() => { executeMove(pendingPromotion.id, { ...pendingPromotion.move, promote: true }); setPendingPromotion(null); }} style={{ padding: "16px 32px", background: "#ef4444", border: "none", color: "white", borderRadius: "16px", cursor: "pointer" }}>成る</button>
                        <button onClick={() => { executeMove(pendingPromotion.id, { ...pendingPromotion.move, promote: false }); setPendingPromotion(null); }} style={{ padding: "16px 32px", background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: "16px", cursor: "pointer" }}>成らない</button>
                    </div>
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
