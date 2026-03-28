// @ts-nocheck
import { useGLTF, useProgress, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function ShogiLoader() {
    const { progress } = useProgress();
    const modelPath = "/models/hisya.glb";

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

            <Html fullscreen>
                <div style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    padding: "10vh 10vw",
                    background: "radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)",
                    pointerEvents: "none",
                    zIndex: 1000
                }}>
                    {/* 進行中のテキストメッセージ（オプション） */}
                    <div style={{
                        fontSize: "1.5rem",
                        color: "rgba(245, 230, 200, 0.6)",
                        fontWeight: 700,
                        letterSpacing: "0.2em",
                        marginBottom: "24px",
                        textShadow: "0 0 10px rgba(0,0,0,0.5)"
                    }}>
                        LOADING MODELS... {progress.toFixed(0)}%
                    </div>

                    {/* 画面横幅いっぱいのバー */}
                    <div style={{
                        width: "100%",
                        height: "32px",
                        background: "rgba(255, 255, 255, 0.03)",
                        borderRadius: "16px",
                        overflow: "hidden",
                        border: "2px solid rgba(232, 131, 74, 0.2)",
                        backdropFilter: "blur(8px)",
                        boxShadow: "0 0 30px rgba(0,0,0,0.3)"
                    }}>
                        <div style={{
                            width: `${progress}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, #e8834a, #fce0a2)",
                            boxShadow: "0 0 40px rgba(232, 131, 74, 0.8)",
                            transition: "width 0.4s cubic-bezier(0.1, 0, 0.2, 1)"
                        }} />
                    </div>
                </div>
            </Html>
        </group>
    );
}

export default ShogiLoader;