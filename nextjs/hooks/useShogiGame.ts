import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Socket } from "socket.io-client";
import { useGameLogic } from "./useGameLogic";
import { PlayerSide } from "@/types/game";
import { Pos, UIBoard, sfenToUIBoard, PieceType, type Move } from "@torassen/shogi-logic";

const KANJI_TO_PIECE_TYPE: Record<string, PieceType> = {
	"歩": PieceType.PAWN,
	"銀": PieceType.SILVER,
	"金": PieceType.GOLD,
	"角": PieceType.BISHOP,
	"飛": PieceType.ROOK,
	"玉": PieceType.KING,
};

export function useShogiGame(
	socket: Socket | null | undefined,
	roomId: string | undefined,
	mySide: PlayerSide,
	wsStatus: "connected" | "disconnected" | "connecting"
) {
	const router = useRouter();
	const [lastMove, setLastMove] = useState<Move | null>(null);
	const [gotSfen, setGotSfen] = useState<boolean>(false);

	const {
		board,
		turn,
		senteHand,
		goteHand,
		selected,
		setSelected,
		selectedHandPiece,
		setSelectedHandPiece,
		promoteDialog,
		setPromoteDialog,
		isMyTurn,
		isLegalTarget,
		isLegalDropTarget,
		getLegalTargetInfo,
		applyMove,
		applyDrop,
		gameResult,
		setGameResult,
		isCheck,
		syncBoardState,
	} = useGameLogic(mySide);

	// ========= アクション (WebSocket付き) =========

	const executeMove = useCallback(
		(from: Pos, to: Pos, promote: boolean) => {
			applyMove(from, to, promote);

			if (socket && roomId) {
				socket.emit("move", { roomId, from, to, promote });
			}
		},
		[applyMove, socket, roomId]
	);

	const executeDrop = useCallback(
		(kanji: string, to: Pos) => {
			const side = turn;
			applyDrop(kanji, to, side);

			if (socket && roomId) {
				socket.emit("move", { roomId, drop: kanji, to });
			}
		},
		[turn, applyDrop, socket, roomId]
	);

	// ========= 相手の手を受信 =========

	useEffect(() => {
		if (!socket) return;

		const handleMoveMade = (data: {
			from?: Pos;
			to: Pos;
			promote?: boolean;
			drop?: string;
		}) => {
			if (data.drop) {
				const oppSide = mySide === "sente" ? "gote" : "sente";
				applyDrop(data.drop, data.to, oppSide);
				setLastMove({ type: "drop", pieceType: KANJI_TO_PIECE_TYPE[data.drop] || PieceType.PAWN, to: data.to });
			} else if (data.from) {
				applyMove(data.from, data.to, data.promote ?? false);
				setLastMove({ type: "move", from: data.from, to: data.to, promote: data.promote ?? false });
			}
		};

		const handleMatchEnded = (data: { winner: string | null; message: string }) => {

			// 自分の勝敗に合わせてメッセージを書き換える
			let displayMessage = data.message;
			if (data.winner && mySide !== "spectator") {
				const isWin = data.winner === mySide;
				displayMessage = isWin ? "あなたの勝ちです！" : "あなたの負けです。";
				if (data.message.includes("投了")) {
					displayMessage += ` (${data.message})`;
				}
			}

			setGameResult({
				isOver: true,
				winner: data.winner as "sente" | "gote" | "draw" | null,
				message: displayMessage,
			});
		};

		socket.on("moveMade", handleMoveMade);
		socket.on("match_ended", handleMatchEnded);
		return () => {
			socket.off("moveMade", handleMoveMade);
			socket.off("match_ended", handleMatchEnded);
		};
	}, [socket, applyMove, applyDrop, mySide, setGameResult]);

	useEffect(() => {
		if (!socket || !roomId) return;

		socket.emit("getGameState", { roomId });

		const handleSyncState = (data: { sfen: string }) => {
			const syncedBoard = sfenToUIBoard(data.sfen);
			syncBoardState(syncedBoard);
		};

		setGotSfen(true);
		socket.on("syncState", handleSyncState);
		return () => {
			socket.off("syncState", handleSyncState);
		};
	}, [socket, roomId]);

	// ========= クリックハンドラ =========

	const handleCellClick = (pos: Pos) => {
		if (roomId && wsStatus !== "connected") return;
		if (roomId && !isMyTurn) return;
		if (promoteDialog) return;
		if (gameResult.isOver) return;

		const cell = board[pos.row][pos.col];

		// 持ち駒選択中
		if (selectedHandPiece) {
			if (isLegalDropTarget(pos)) {
				executeDrop(selectedHandPiece, pos);
			} else if (cell && cell.side === mySide) {
				setSelectedHandPiece(null);
				setSelected(pos);
			} else {
				setSelectedHandPiece(null);
			}
			return;
		}

		// 盤上の駒選択中
		if (selected) {
			if (cell && cell.side === mySide) {
				setSelected(pos);
				return;
			}

			const targetInfo = getLegalTargetInfo(pos);
			if (targetInfo) {
				const from = { row: selected.row, col: selected.col };
				const to = pos;

				if (targetInfo.canPromote) {
					setPromoteDialog({ from, to });
				} else if (targetInfo.mustPromote) {
					executeMove(from, to, true);
				} else {
					executeMove(from, to, targetInfo.promote);
				}
			} else {
				setSelected(null);
			}
		} else {
			// 自分の手番の駒を選択
			if (cell && cell.side === turn) {
				setSelected(pos);
				setSelectedHandPiece(null);
			}
		}
	};

	const handleHandPieceClick = (kanji: string) => {
		if (roomId && wsStatus !== "connected") return;
		if (roomId && !isMyTurn) return;
		if (promoteDialog) return;
		if (turn !== mySide) return;
		if (gameResult.isOver) return;

		setSelected(null);
		setSelectedHandPiece(selectedHandPiece === kanji ? null : kanji);
	};

	const handleEndMatch = async () => {
		if (mySide === "spectator") {
			router.push("/home");
			return;
		}
		if (gameResult.isOver) {
			const isWin = gameResult.winner === mySide;
			const winParam = isWin ? "true" : "false";
			const reasonPara = encodeURIComponent(gameResult.message || "対局終了");
			router.push(`/result?win=${winParam}&reason=${reasonPara}${roomId ? `&roomId=${roomId}` : ""}`);
			return;
		}
		if (roomId && socket) {
			const winner = (mySide === "sente" ? "gote" : "sente") as "sente" | "gote";
			socket.emit("resign_match", { roomId });
			setGameResult({
				isOver: true,
				winner: winner,
				message: "投了しました"
			});
		} else {
			router.push("/home");
		}
	};

	useEffect(() => {
		const resultStatus = gameResult.winner === mySide ? "win" : "lose";

		if(gameResult.winner)
			fetch("/api/result", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ result: resultStatus }), 
			});
	},[gameResult.winner])

	return {
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
		gameOver: gameResult.message,
		gotSfen,
	};
}
