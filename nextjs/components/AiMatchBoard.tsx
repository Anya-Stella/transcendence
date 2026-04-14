"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useAiGame } from "@/hooks/useAiGame";
import { PieceData, Color, PieceType, Move } from "@torassen/shogi-logic";
import TatamiBackground from "@/components/TatamiBackground";
import VictoryAnimation from "@/components/Overlay/VictoryAnimation";
import DefeatAnimation from "@/components/Overlay/DefeatAnimation";
import { uiBoardToBoardState } from "./MatchBoard";
import { useUser } from "@/hooks/useUser";
import Overlay from "./Overlay/OteOverlay";
import Header from "@/components/Header";

const PIECE_TYPE_TO_KANJI: Record<number, string> = {
	[PieceType.PAWN]: "歩",
	[PieceType.SILVER]: "銀",
	[PieceType.GOLD]: "金",
	[PieceType.BISHOP]: "角",
	[PieceType.ROOK]: "飛",
	[PieceType.KING]: "玉",
};

function PieceComponent({ piece, isPromoted }: { piece: PieceData; isPromoted?: boolean }) {
	// 2Dの駒を非表示にする
	return null;
}

interface AiMatchBoardProps {
	mySide?: "sente" | "gote";
	aiDepth?: number;
	isPreparing?: boolean;
}

function AiMatchBoard({ mySide = "sente", aiDepth = 4, isPreparing = false }: AiMatchBoardProps) {
	const router = useRouter();
	const user = useUser();
	const { data: session } = useSession();
	const [isLoaded, setIsLoaded] = useState(false);

	const {
		board,
		turn,
		senteHand,
		goteHand,
		promoteDialog,
		setPromoteDialog,
		executeMove,
		executeDrop,
		handleEndMatch,
		aiThinking,
		lastMove,
		isCheck,
		gameResult,
		gameOver
	} = useAiGame(mySide as "sente" | "gote", aiDepth);

	let state = uiBoardToBoardState({ board: board, senteHand: senteHand, goteHand: goteHand, turn: turn });

	const [showCheckOverlay, setShowCheckOverlay] = useState(false);
	const [showResultOverlay, setShowResultOverlay] = useState(false);

	// 王手が発生したときに一定時間（2秒）だけオーバーレイを表示
	useEffect(() => {
		if (isCheck) {
			setShowCheckOverlay(true);
			const timer = setTimeout(() => setShowCheckOverlay(false), 2000);
			return () => clearTimeout(timer);
		} else {
			setShowCheckOverlay(false);
		}
	}, [isCheck]);

	const handleLogout = async () => {
		await fetch("/api/auth/logout", { method: "POST" });
		router.push("/login");
		router.refresh();
	};

	return (
		<div className="wafuu-page">
			{/* 背景 */}
			<TatamiBackground
				state={state}
				playerColor={mySide === "sente" ? Color.BLACK : Color.WHITE}
				externalTurn={turn === "sente" ? Color.BLACK : Color.WHITE}
				lastExternalMove={lastMove || undefined}
				isGameOver={!!gameOver}
				isPreparing={isPreparing}
				onLoaded={() => setIsLoaded(true)}
				onBoardMove={(move: Move) => {
					if (move.type === "move") {
						executeMove(move.from, move.to, move.promote ?? false);
					} else if (move.type === "drop") {
						const kanji = PIECE_TYPE_TO_KANJI[move.pieceType];
						if (kanji) {
							executeDrop(kanji, move.to);
						}
					}
				}}
			/>

			{!isPreparing && isLoaded && (
				<>
					<Header
						title="将棋ゲーム"
						pageName="AI対戦"
						userName={session?.user?.name || undefined}
						onLogout={handleLogout}
						logoutLabel="退出"
					/>

					{/* コンテンツ */}
					<div className="wafuu-content" style={{ flex: 1, padding: 0, overflow: "hidden", pointerEvents: "none" }}>
						{/* 王手！ オーバーレイ (盤面中央) */}
						{showCheckOverlay && <Overlay />}
						{/* ターン表示 (中央上部) */}
						<div
							style={{
								position: "fixed",
								top: "76px",
								left: "50%",
								transform: "translateX(-50%)",
								display: "flex",
								alignItems: "center",
								gap: "14px",
								zIndex: 50,
								pointerEvents: "auto"
							}}
						>
							<span
								style={{
									padding: "10px 28px",
									borderRadius: "30px",
									fontSize: "1.05rem",
									letterSpacing: "0.1em",
									fontWeight: 900,
									background: "rgba(20, 15, 10, 0.8)",
									color: turn === "sente" ? "#e8834a" : "#6495ed",
									border: `2px solid ${turn === "sente" ? "rgba(232, 131, 74, 0.8)" : "rgba(100, 149, 237, 0.8)"}`,
									boxShadow: `0 0 15px ${turn === "sente" ? "rgba(232, 131, 74, 0.3)" : "rgba(100, 149, 237, 0.3)"}, inset 0 0 8px rgba(255, 255, 255, 0.05)`,
									backdropFilter: "blur(12px)",
									textShadow: `0 0 10px ${turn === "sente" ? "rgba(232, 131, 74, 0.4)" : "rgba(100, 149, 237, 0.4)"}`
								}}
							>
								{turn === "sente" ? "▲ 先手の番" : "△ 後手の番"}
							</span>
							{isCheck && (
								<span
									style={{
										padding: "6px 16px",
										background: "rgba(0, 0, 0, 0.3)",
										border: "2px solid #000000",
										borderRadius: "20px",
										color: "#000000",
										fontSize: "0.9rem",
										fontWeight: 900,
										animation: "pulse 1.5s infinite",
										boxShadow: "0 0 10px rgba(0, 0, 0, 0.4)",
										textShadow: "0 0 5px rgba(255, 255, 255, 0.2)"
									}}
								>
									王手
								</span>
							)}
							{aiThinking && (
								<span className="ai-thinking" style={{ color: "#f5e6c8" }}>🤔 AI思考中...</span>
							)}
							{gameOver && (
								<div
									className="game-over-banner"
									style={{
										display: "flex",
										alignItems: "center",
										gap: "12px",
										padding: "10px 24px",
										background: "rgba(232, 131, 74, 0.2)",
										border: "2px solid #e8834a",
										borderRadius: "30px",
										backdropFilter: "blur(10px)",
										boxShadow: "0 0 20px rgba(232, 131, 74, 0.4)",
										animation: "fadeIn 0.5s ease-out"
									}}
								>
									<span style={{ fontSize: "1.2rem", color: "#f5e6c8", fontWeight: 800 }}> {gameOver}</span>
								</div>
							)}
						</div>

						{/* 対局終了通知 */}
						{gameOver && (
							<div
								style={{
									position: "fixed",
									bottom: "100px",
									left: "50%",
									transform: "translateX(-50%)",
									zIndex: 2000,
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									gap: "16px",
									animation: "fadeIn 0.5s ease-out",
									pointerEvents: "auto"
								}}
							>
								<button
									onClick={() => setShowResultOverlay(true)}
									style={{
										padding: "18px 48px",
										fontSize: "1.25rem",
										fontWeight: 900,
										background: "rgba(255, 255, 255, 0.15)",
										border: "1px solid rgba(255, 255, 255, 0.3)",
										color: "#ffffff",
										borderRadius: "40px",
										cursor: "pointer",
										backdropFilter: "blur(12px)",
										boxShadow: "0 10px 25px rgba(0,0,0,0.3), inset 0 0 10px rgba(255, 255, 255, 0.1)",
										letterSpacing: "0.2em",
										transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
									}}
									onMouseOver={(e) => {
										e.currentTarget.style.transform = "scale(1.05) translateY(-2px)";
										e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
										e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.5)";
									}}
									onMouseOut={(e) => {
										e.currentTarget.style.transform = "scale(1)";
										e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
										e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
									}}
								>
									結果を確認する
								</button>
							</div>
						)}

						{/* 右上 (AI / 対戦相手) */}
						<div
							style={{
								position: "fixed",
								top: "76px",
								right: "24px",
								display: "flex",
								flexDirection: "column",
								alignItems: "flex-end",
								zIndex: 50,
								pointerEvents: "auto",
								gap: "12px"
							}}
						>
							<div style={{
								display: "flex",
								alignItems: "center",
								gap: "12px",
								background: "rgba(20, 15, 10, 0.7)",
								padding: "8px 16px",
								borderRadius: "24px",
								border: "1px solid rgba(232, 131, 74, 0.25)",
								backdropFilter: "blur(12px)",
								boxShadow: "0 4px 15px rgba(0,0,0,0.4)"
							}}>
								{mySide === "sente" ? (
									<>
										<span style={{ color: "#f5e6c8", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "0.02em" }}>AI 🤖</span>
										<span className="board-player-badge badge-gote" style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>後手</span>
									</>
								) : (
									<>
										<span className="board-player-badge badge-sente" style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>先手</span>
										<span style={{ color: "#f5e6c8", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "0.02em" }}>AI 🤖</span>
									</>
								)}
							</div>
						</div>


						{/* 左下 (あなた) */}
						<div
							style={{
								position: "fixed",
								bottom: "24px",
								left: "24px",
								display: "flex",
								flexDirection: "column",
								alignItems: "flex-start",
								zIndex: 50,
								pointerEvents: "auto",
								gap: "12px"
							}}
						>
							<div style={{
								display: "flex",
								alignItems: "center",
								gap: "12px",
								background: "rgba(20, 15, 10, 0.7)",
								padding: "8px 16px",
								borderRadius: "24px",
								border: "1px solid rgba(232, 131, 74, 0.25)",
								backdropFilter: "blur(12px)",
								boxShadow: "0 4px 15px rgba(0,0,0,0.4)"
							}}>
								{mySide === "gote" ? (
									<>
										<span style={{ color: "#f5e6c8", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "0.02em" }}>あなた</span>
										<span className="board-player-badge badge-gote" style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>後手</span>
									</>
								) : (
									<>
										<span className="board-player-badge badge-sente" style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>先手</span>
										<span style={{ color: "#f5e6c8", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "0.02em" }}>あなた</span>
									</>
								)}
							</div>
						</div>

						{/* 対局終了ボタン (右下) */}
						{!gameOver && (
							<button
								style={{
									position: "fixed",
									bottom: "24px",
									right: "24px",
									padding: "12px 24px",
									fontSize: "0.95rem",
									fontWeight: 700,
									border: "2px solid rgba(220, 60, 60, 0.6)",
									borderRadius: "12px",
									color: "#fff",
									background: "rgba(180, 40, 40, 0.7)",
									backdropFilter: "blur(8px)",
									cursor: "pointer",
									zIndex: 50,
									boxShadow: "0 4px 16px rgba(180, 40, 40, 0.3)",
									transition: "all 0.2s ease",
									pointerEvents: "auto"
								}}
								onClick={handleEndMatch}
							>
								投了する
							</button>
						)}
					</div>

					{/* Promotion dialog */}
					{promoteDialog && (
						<div className="promote-overlay" style={{ zIndex: 1000 }} onClick={() => setPromoteDialog(null)}>
							<div className="promote-dialog" onClick={(e) => e.stopPropagation()}>
								<p className="promote-title">成りますか？</p>
								<div className="promote-buttons">
									<button
										className="btn promote-btn promote-btn-yes"
										onClick={() => executeMove(promoteDialog.from, promoteDialog.to, true)}
									>
										成る
									</button>
									<button
										className="btn promote-btn promote-btn-no"
										onClick={() => executeMove(promoteDialog.from, promoteDialog.to, false)}
									>
										不成
									</button>
								</div>
							</div>
						</div>
					)}
					{/* Result Overlay */}
					{showResultOverlay && (
						<div
							style={{
								position: "fixed",
								inset: 0,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								background: "rgba(0, 0, 0, 0.75)",
								backdropFilter: "blur(8px)",
								zIndex: 5000,
								animation: "fadeIn 0.3s ease-out"
							}}
							onClick={() => setShowResultOverlay(false)}
						>
							<div
								style={{
									background: "rgba(20, 15, 10, 0.95)",
									padding: "60px 80px",
									borderRadius: "32px",
									border: `2px solid ${gameResult.winner === mySide
										? "rgba(212, 175, 55, 0.4)"
										: "rgba(150, 150, 150, 0.2)"}`,
									boxShadow: `0 0 60px ${gameResult.winner === mySide
										? "rgba(212, 175, 55, 0.2)"
										: "rgba(0, 0, 0, 0.3)"}`,
									textAlign: "center",
									minWidth: "400px",
									animation: "resultPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
								}}
								onClick={(e) => e.stopPropagation()}
							>
								{/* 結果アイコン */}
								<div style={{ fontSize: "5rem", marginBottom: "20px" }}>
									{gameResult.winner === mySide ? <VictoryAnimation /> : <DefeatAnimation />}
								</div>

								{/* 結果テキスト */}
								<h2
									style={{
										fontSize: "4.5rem",
										fontWeight: 900,
										letterSpacing: "0.2em",
										color: gameResult.winner === mySide ? "#d4af37" : "#888",
										textShadow: gameResult.winner === mySide
											? "0 0 40px rgba(212, 175, 55, 0.6)"
											: "0 0 20px rgba(255, 255, 255, 0.1)",
										margin: "0 0 24px",
										fontFamily: "'M PLUS Rounded 1c', sans-serif"
									}}
								>
									{gameResult.winner === mySide ? "勝利" : "敗北"}
								</h2>

								<p
									style={{
										color: "rgba(245, 230, 200, 0.8)",
										fontSize: "1.2rem",
										marginBottom: "48px",
										fontWeight: 500
									}}
								>
									{gameResult.message || "お疲れ様でした。"}
								</p>

								<div
									style={{
										display: "flex",
										flexDirection: "column",
										gap: "16px"
									}}
								>
									<Link
										href="/home"
										style={{
											padding: "16px 32px",
											background: gameResult.winner === mySide
												? "rgba(212, 175, 55, 0.9)"
												: "rgba(100, 100, 100, 0.8)",
											color: "#000",
											borderRadius: "16px",
											fontWeight: 900,
											fontSize: "1.1rem",
											textDecoration: "none",
											boxShadow: `0 4px 15px ${gameResult.winner === mySide
												? "rgba(212, 175, 55, 0.4)"
												: "rgba(0, 0, 0, 0.2)"}`,
											transition: "all 0.2s"
										}}
									>
										ホームに戻る
									</Link>
									<button
										onClick={() => setShowResultOverlay(false)}
										style={{
											background: "transparent",
											border: "2px solid rgba(245, 230, 200, 0.3)",
											color: "rgba(245, 230, 200, 0.7)",
											padding: "12px 24px",
											borderRadius: "16px",
											cursor: "pointer",
											fontSize: "0.95rem",
											fontWeight: 600,
											transition: "all 0.2s"
										}}
									>
										盤面を振り返る
									</button>
								</div>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}

export default AiMatchBoard;
export { AiMatchBoard };
