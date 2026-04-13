"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import { useShogiGame } from "@/hooks/useShogiGame";
import { Color, PieceType, PType, Hand, Piece, UIBoard, BoardState, Move, HandPieces } from "@torassen/shogi-logic";
import TatamiBackground from "@/components/TatamiBackground";
import { useUser } from "@/hooks/useUser";
import { PlayerSide } from "@/types/game";
import GameStatusBanner from "./GamaStatusBanner/GamaStatusBanner";
import EnemyInfo from "./Info/EnemyInfo";
import MyInfo from "./Info/MyInfo";
import SarenderButton from "./Button/Sarender";
import GameResultButton from "./Button/GameResult";
import ShowResultOverlay from "./Overlay/ShowResultOverlay";
import OteOverlay from "@/components/Overlay/OteOverlay";
import Header from "@/components/Header";
import Chat from "./Chat/Chat";


export const PIECE_TYPE_TO_KANJI: Record<number, string> = {
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

const convertHandPiecesToHand = (handPieces: HandPieces): Hand => {
	const hand: Hand = {};

	Object.entries(handPieces).forEach(([kanji, count]) => {
		let type = KANJI_TO_PTYPE[kanji];

		if (type >= PType.PRO_PAWN) {
			type = (type - 6) as PType;
		}

		hand[type] = (hand[type] || 0) + count;
	});

	return hand;
};

export function uiBoardToBoardState(uiBoard: UIBoard, moveCount: number = 0): BoardState {
	// 1. 盤面（board）の変換
	const board: (Piece | null)[][] = uiBoard.board.map((row) =>
		row.map((cell) => {
			if (!cell) return null;

			const pieceType = KANJI_TO_PTYPE[cell.kanji];
			if (pieceType === undefined) return null;

			return {
				color: cell.side === "sente" ? Color.BLACK : Color.WHITE,
				pieceType: pieceType,
			};
		})
	);

	const hands: [Hand, Hand] = [
		{ ...convertHandPiecesToHand(uiBoard.senteHand) },
		{ ...convertHandPiecesToHand(uiBoard.goteHand) },
	];
	const sideToMove = uiBoard.turn === "sente" ? Color.BLACK : Color.WHITE;

	return {
		board,
		hands,
		sideToMove,
		moveCount,
	};
}

interface MatchBoardProps {
	roomId?: string;
	socket?: Socket | null;
	wsStatus?: "connected" | "disconnected" | "connecting";
	mySide?: PlayerSide;
	isPreparing?: boolean;
	initialMessages?: any[];
}

function MatchBoard({ roomId, socket, wsStatus = "disconnected", mySide = "sente", isPreparing = false, initialMessages }: MatchBoardProps) {
	const router = useRouter();
	const user = useUser();
	const { data: session } = useSession();
	const [isLoaded, setIsLoaded] = useState(false);

	const {
		board,
		turn,
		senteHand,
		goteHand,
		isMyTurn,
		executeMove,
		executeDrop,
		handleEndMatch,
		lastMove,
		isCheck,
		gameResult,
		gameOver,
		gotSfen
	} = useShogiGame(socket, roomId, mySide, wsStatus);

	const state = useMemo(() => {
		return uiBoardToBoardState({ board, senteHand, goteHand, turn });
	}, [board, senteHand, goteHand, turn]);

	const [showCheckOverlay, setShowCheckOverlay] = useState<boolean>(false);
	const [showResultOverlay, setShowResultOverlay] = useState<boolean>(false);

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
			{gotSfen &&
				<TatamiBackground
					state={state}
					playerColor={mySide === "sente" ? Color.BLACK : (mySide === "gote" ? Color.WHITE : undefined)}
					externalTurn={turn === "sente" ? Color.BLACK : Color.WHITE}
					lastExternalMove={lastMove || undefined}
					isGameOver={!!gameOver}
					isPreparing={isPreparing}
					onLoaded={() => { setIsLoaded(true); }}
					onBoardMove={(move: Move) => {
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
			}


			{!isPreparing && isLoaded && (
				<>
					<Header
						title="将棋ゲーム"
						rightElement={
							roomId && (
								<span style={{ color: "rgba(245, 230, 200, 0.4)", fontSize: "0.8rem", marginRight: "8px" }}>
									部屋: {roomId} | {statusLabel}
								</span>
							)
						}
						userName={session?.user?.name || undefined}
						onLogout={handleLogout}
						logoutLabel="ログアウト"
					/>

					{/* コンテンツ */}
					<div className="wafuu-content" style={{ flex: 1, padding: 0, overflow: "hidden", pointerEvents: "none" }}>
						{/* 王手！ オーバーレイ (盤面中央) */}
						{showCheckOverlay && <OteOverlay />}

						{/* 手番表示 (中央上部) */}
						{<GameStatusBanner
							turnIsSente={turn === "sente" ? true : false}
							isCheck={isCheck}
							isGameOver={gameOver !== null}
							gameOver={gameOver as string}
							mySide={mySide}
							isMyTurn={mySide === turn}
							roomId={roomId as string}
						/>}

						{/* 対局終了通知 */}
						{gameOver && <GameResultButton clickHandler={setShowResultOverlay} />}

						{/* 右下 (対戦相手の情報) */}
						<EnemyInfo mySide={mySide} />

						{/* チャット画面 (右下) */}
						{roomId && (
							<Chat
								socket={socket}
								roomId={roomId}
								mySide={mySide}
								initialMessages={initialMessages}
							/>
						)}

						{/* 左下 (あなたの情報) */}
						<MyInfo mySide={mySide} />


						{/* 下部のボタン (右下) */}
						<SarenderButton isGameOver={gameOver !== null} mySide={mySide} clickHandler={handleEndMatch} />
					</div>

					{/* Result Overlay */}
					{showResultOverlay && <ShowResultOverlay
						isWinner={gameResult.winner === mySide}
						isSpectator={mySide === "spectator"}
						gameResult={gameOver as string}
						clickHandler={setShowResultOverlay}
					/>}
				</>
			)}
		</div>
	);
}

export default MatchBoard;
export { MatchBoard };