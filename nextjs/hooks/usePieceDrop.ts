import { useState, useCallback, useRef, useEffect } from "react";
import * as THREE from "three";
import { useThree, ThreeEvent } from "@react-three/fiber";

interface UsePieceDragProps {
    pieceId: string;
    initialPosition: [number, number, number];
    parentGroupRef: React.RefObject<THREE.Group>;
    onSelect: (id: string | null) => void;
    onDragEnd: (id: string, newPos: [number, number, number]) => void;
    draggable: boolean;
}

export function usePieceDrog({
    pieceId,
    initialPosition,
    parentGroupRef,
    onSelect,
    onDragEnd,
    draggable
}: UsePieceDragProps) {
    const { camera, gl } = useThree();
    
    // 状態管理
    const [isDragging, setIsDragging] = useState(false);
    const [pos, setPos] = useState<[number, number, number]>(initialPosition);

    // 数学オブジェクトの参照（毎フレーム生成しないようにrefで保持）
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2());
    const intersectPoint = useRef(new THREE.Vector3());
    
    // クロージャ対策用の最新位置保持
    const posRef = useRef<[number, number, number]>(initialPosition);
    useEffect(() => {
        setPos(initialPosition);
        posRef.current = initialPosition;
    }, [initialPosition]);

    const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
        if (!draggable) return;
        
        e.stopPropagation();
        onSelect(pieceId);
        setIsDragging(true);
        gl.domElement.style.cursor = "grabbing";

        const parentGroup = parentGroupRef.current;
        if (!parentGroup) return;

        // ドラッグ平面の作成（駒の現在の高さで水平な平面）
        const worldPos = new THREE.Vector3();
        e.object.getWorldPosition(worldPos);
        
        const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(parentGroup.quaternion);
        const dragPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, worldPos);

        const onMove = (ev: PointerEvent) => {
            const rect = gl.domElement.getBoundingClientRect();
            mouseRef.current.set(
                ((ev.clientX - rect.left) / rect.width) * 2 - 1,
                -((ev.clientY - rect.top) / rect.height) * 2 + 1
            );
            
            raycasterRef.current.setFromCamera(mouseRef.current, camera);

            if (raycasterRef.current.ray.intersectPlane(dragPlane, intersectPoint.current)) {
                // ワールド座標からローカル座標へ変換
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
            
            // 親コンポーネントからの初期位置にリセット（スナップは親が制御する想定）
            setPos(initialPosition);
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
    }, [pieceId, draggable, onSelect, onDragEnd, gl, camera, parentGroupRef, initialPosition]);

    return {
        isDragging,
        pos,
        handlePointerDown
    };
}