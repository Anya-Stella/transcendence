"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Socket } from "socket.io-client";
import { useShogiGame } from "@/hooks/useShogiGame";
import { DEMOTE_MAP, PieceData, HandPieces, Color, PieceType, PType, UIBoard, BoardState, Piece, Hand } from "@torassen/shogi-logic";
import TatamiBackground from "@/components/TatamiBackground";
import VictoryAnimation from "@/components/VictoryAnimation";
import DefeatAnimation from "@/components/DefeatAnimation";

const PIECE_TYPE_TO_KANJI: Record<number, string> = {
	[PieceType.PAWN]: "歩",
	[PieceType.SILVER]: "銀",
	[PieceType.GOLD]: "金",
	[PieceType.BISHOP]: "角",
	[PieceType.ROOK]: "飛",
	[PieceType.KING]: "玉",
};

export const KANJI_TO_PTYPE: Record<string, PType> = {
  "歩": PType.PAWN,
  "銀": PType.SILVER,
  "金": PType.GOLD,
  "角": PType.BISHOP,
  "飛": PType.ROOK,
  "玉": PType.KING,
  "王": PType.KING,
  "と": PType.PRO_PAWN,
  "全": PType.PRO_SILVER,
  "馬": PType.PRO_BISHOP,
  "龍": PType.PRO_ROOK,
};

export function uiBoardToBoardState(uiBoard: UIBoard, moveCount: number = 0): BoardState {
  // 1. 盤面（board）の変換
  const board: (Piece | null)[][] = uiBoard.board.map((row) =>
    row.map((cell) => {
      if (!cell) return null;

      const pieceType = KANJI_TO_PTYPE[cell.kanji];
      // 対応する駒種がない場合はエラー回避のため null を返す
      if (pieceType === undefined) return null;

      return {
        color: cell.side === "sente" ? Color.BLACK : Color.WHITE,
        pieceType: pieceType,
      };
    })
  );

  const hands: [Hand, Hand] = [
    { ...uiBoard.senteHand },
    { ...uiBoard.goteHand },
  ];
  const sideToMove = uiBoard.turn === "sente" ? Color.BLACK : Color.WHITE;

  return {
    board,
    hands,
    sideToMove,
    moveCount,
  };
}

function PieceComponent({ piece, isPromoted }: { piece: PieceData; isPromoted?: boolean }) {
	// 2Dの駒を非表示にする（TatamiBackgroundで表示するため）
	return null;
}

interface MatchBoardProps {
	roomId?: string;
	socket?: Socket | null;
	wsStatus?: "connected" | "disconnected" | "connecting";
	mySide?: "sente" | "gote" | "spectator";
	isPreparing?: boolean;
}

function MatchBoard({ roomId, socket, wsStatus = "disconnected", mySide = "sente", isPreparing = false }: MatchBoardProps) {
	const router = useRouter();
	const [user, setUser] = useState<{ name: string } | null>(null);
	const [isLoaded, setIsLoaded] = useState(false);

	const {
		board,
		turn,
		senteHand,
		goteHand,
		selected,
		selectedHandPiece,
		isMyTurn,
		isLegalTarget,
		isLegalDropTarget,
		promoteDialog,
		setPromoteDialog,
		executeMove,
		executeDrop,
		handleCellClick,
		handleHandPieceClick,
		handleEndMatch,
		lastMove,
		isCheck,
		gameResult,
		gameOver
	} = useShogiGame(socket, roomId, mySide, wsStatus);

	const state = useMemo(() => {
    return uiBoardToBoardState({ board, senteHand, goteHand, turn });
	}, [board, senteHand, goteHand, turn]);

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

	// ユーザー情報取得
	useEffect(() => {
		fetch("/api/me")
			.then((res) => res.json())
			.then((data) => {
				if (data.user) setUser(data.user);
			})
			.catch(() => { });
	}, []);

	const handleLogout = async () => {
		await fetch("/api/auth/logout", { method: "POST" });
		router.push("/login");
		router.refresh();
	};

	// WS接続ステータス
	const statusLabel =
		wsStatus === "connected"
			? "✅ 接続中"
			: wsStatus === "connecting"
				? "🔄 接続中..."
				: "❌ 切断";

	// Hand piece display order
	const handOrder = ["飛", "角", "金", "銀", "歩"];

	return (
		<div className="wafuu-page">
			{/* 背景 */}
			<TatamiBackground
				state={state}
				playerColor={mySide === "sente" ? Color.BLACK : Color.WHITE}
				externalTurn={state.sideToMove}
				lastExternalMove={lastMove || undefined}
				isGameOver={!!gameOver}
				isPreparing={isPreparing}
				onLoaded={() => setIsLoaded(true)}
				onBoardMove={(move) => {
					if (mySide === "spectator") return;
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
					{/* ヘッダー */}
					<header className="wafuu-header">
						<Link href="/home" className="wafuu-header-logo">
							将棋ゲーム
						</Link>
						<div className="wafuu-header-right">
							{roomId && (
								<span style={{ color: "rgba(245, 230, 200, 0.4)", fontSize: "0.8rem", marginRight: "8px" }}>
									部屋: {roomId} | {statusLabel}
								</span>
							)}
							{user && (
								<span className="wafuu-header-username">{user.name}</span>
							)}
							<button
								className="wafuu-header-btn"
								onClick={handleLogout}
							>
								ログアウト
							</button>
						</div>
					</header>

					{/* コンテンツ */}
					<div className="wafuu-content" style={{ flex: 1, padding: 0, overflow: "hidden", pointerEvents: "none" }}>
						{/* 王手！ オーバーレイ (盤面中央) */}
						{showCheckOverlay && (
							<div
								className="wafuu-pulse"
								style={{
									position: "fixed",
									top: "50%",
									left: "50%",
									transform: "translate(-50%, -50%)",
									zIndex: 100,
									pointerEvents: "none",
									textAlign: "center"
								}}
							>
								<span
									style={{
										fontSize: "8rem",
										fontWeight: 900,
										color: "#000000",
										textShadow: "0 0 15px rgba(255, 255, 255, 0.6), 0 0 30px rgba(255, 255, 255, 0.3)",
										letterSpacing: "0.4em",
										whiteSpace: "nowrap",
										filter: "drop-shadow(0 0 10px rgba(0,0,0,0.8))"
									}}
								>
									王手
								</span>
							</div>
						)}
						{/* 手番表示 (中央上部) */}
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
							{roomId && !gameOver && (
								<span style={{ color: "rgba(245, 230, 200, 0.6)", fontSize: "0.9rem", fontWeight: 700 }}>
									{mySide === "spectator" ? "（観戦中）" : (isMyTurn ? "（あなたの番です）" : "（相手の番です）")}
								</span>
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

						{/* 右上 (対戦相手の情報) */}
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
										<span style={{ color: "#f5e6c8", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "0.02em" }}>対戦相手</span>
										<span className="board-player-badge badge-gote" style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>後手</span>
									</>
								) : (
									<>
										<span className="board-player-badge badge-sente" style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>先手</span>
										<span style={{ color: "#f5e6c8", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "0.02em" }}>対戦相手</span>
									</>
								)}
							</div>
						</div>

						{/* 左下 (あなたの情報) */}
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

						{/* 下部のボタン (右下) */}
						<div
							style={{
								position: "fixed",
								bottom: "24px",
								right: "24px",
								display: "flex",
								gap: "12px",
								zIndex: 50,
								pointerEvents: "auto"
							}}
						>
							{!gameOver && (
								<button
									style={{
										padding: "12px 24px",
										fontSize: "0.95rem",
										fontWeight: 700,
										border: "2px solid rgba(220, 60, 60, 0.6)",
										borderRadius: "12px",
										color: "#fff",
										background: "rgba(180, 40, 40, 0.7)",
										backdropFilter: "blur(8px)",
										cursor: "pointer",
										boxShadow: "0 4px 16px rgba(180, 40, 40, 0.3)",
										transition: "all 0.2s ease"
									}}
									onClick={handleEndMatch}
								>
									{mySide === "spectator" ? "退出する" : "投了する"}
								</button>
							)}
						</div>
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
										color: gameResult.winner === mySide ? "#d4af37" : (gameResult.winner === null ? "#f5e6c8" : "#888"),
										textShadow: gameResult.winner === mySide
											? "0 0 40px rgba(212, 175, 55, 0.6)"
											: "0 0 20px rgba(255, 255, 255, 0.1)",
										margin: "0 0 24px",
										fontFamily: "'M PLUS Rounded 1c', sans-serif"
									}}
								>
									{mySide === "spectator" ? "対局終了" : (gameResult.winner === mySide ? "勝利" : (gameResult.winner === null ? "引き分け" : "敗北"))}
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

export default MatchBoard;
export { MatchBoard };