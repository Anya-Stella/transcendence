// @ts-nocheck
import { usePieceAnimation } from "@/hooks/usePieceAnimation";
import { usePieceDrog } from "@/hooks/usePieceDrop";
import { useGLTF, Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

// Propsの型定義
interface DraggablePieceProps {
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
}

function DraggablePiece(props: DraggablePieceProps) {
    const { 
        modelPath, initialPosition, rotation, pieceId, 
        selectedId, onSelect, scale = [0.9, 0.9, 0.9], 
        count = 1, draggable = true 
    } = props;
    
    const { gl } = useThree();
    const { scene } = useGLTF(modelPath);

    const clonedScene = useMemo(() => {
        return setupPieceModel(scene, false); // ghost=false
    }, [scene]);

    const ghostScene = useMemo(() => {
        return setupPieceModel(scene, true); // ghost=true
    }, [scene]);

    const positionGroupRef = useRef<THREE.Group>(null);
    const rotationGroupRef = useRef<THREE.Group>(null);

    const { isDragging, pos, handlePointerDown } = usePieceDrog({
        pieceId,
        initialPosition,
        parentGroupRef: props.parentGroupRef,
        onSelect,
        onDragEnd: props.onDragEnd,
        draggable
    });

    usePieceAnimation({
        positionGroupRef,
        rotationGroupRef,
        targetPos: pos,
        targetRotation: rotation,
        isDragging,
        isPromoted: props.isPromoted
    });

    const isSelected = selectedId === pieceId;

    return (
        <group
            ref={positionGroupRef}
            onPointerDown={handlePointerDown}
            onPointerOver={() => { if(draggable) gl.domElement.style.cursor = "grab"; }}
            onPointerOut={() => { gl.domElement.style.cursor = "auto"; }}
        >
            {isSelected && (
                <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[1.2, 1.6, 32]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} />
                </mesh>
            )}

            <mesh visible={false}>
                <boxGeometry args={[2.5, 2.5, 2.5]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            <group ref={rotationGroupRef}>
                <primitive
                    object={clonedScene}
                    scale={scale}
                />
            </group>

            {isDragging && ghostScene && (
                <group position={[
                    initialPosition[0] - pos[0],
                    initialPosition[1] - (pos[1] + 1), // 駒を持ち上げている分、下げる
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

function setupPieceModel(scene: THREE.Group, isGhost: boolean) {
    const cloned = scene.clone();
    
    cloned.traverse((child) => {
        if (child.isMesh) {
            const mesh = child as THREE.Mesh;
            
            if (mesh.name.toLowerCase().includes("shadow") || mesh.name.toLowerCase().includes("plane")) {
                mesh.visible = false;
                return;
            }

            if (mesh.material instanceof THREE.MeshStandardMaterial) {
                mesh.material = mesh.material.clone();
                mesh.material.envMapIntensity = 0;
            }

            if (isGhost) {
                mesh.castShadow = false;
                mesh.receiveShadow = false;
                
                if (mesh.material instanceof THREE.MeshStandardMaterial) {
                    mesh.material.transparent = true;
                    mesh.material.opacity = 0.3; // 半透明
                }
            } else {
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }
        }
    });
    
    return cloned;
}

export default DraggablePiece;