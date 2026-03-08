import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Socket } from "socket.io-client";
import { useGameLogic } from "./useGameLogic";

export function useShogiGame(
	socket: Socket | null | undefined,
	roomId: string | undefined,
	mySide: "sente" | "gote",
	wsStatus: "connected" | "disconnected" | "connecting"
) {
	const router = useRouter();

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
	} = useGameLogic(mySide);

	// ========= アクション (WebSocket付き) =========

	const executeMove = useCallback(
		(from: { row: number; col: number }, to: { row: number; col: number }, promote: boolean) => {
			applyMove(from, to, promote);

			if (socket && roomId) {
				socket.emit("move", { roomId, from, to, promote });
			}
		},
		[applyMove, socket, roomId]
	);

	const executeDrop = useCallback(
		(kanji: string, to: { row: number; col: number }) => {
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
			from?: { row: number; col: number };
			to: { row: number; col: number };
			promote?: boolean;
			drop?: string;
		}) => {
			if (data.drop) {
				const oppSide = mySide === "sente" ? "gote" : "sente";
				applyDrop(data.drop, data.to, oppSide);
			} else if (data.from) {
				applyMove(data.from, data.to, data.promote ?? false);
			}
		};

		socket.on("moveMade", handleMoveMade);
		return () => {
			socket.off("moveMade", handleMoveMade);
		};
	}, [socket, applyMove, applyDrop, mySide]);

	// ========= クリックハンドラ =========

	const handleCellClick = useCallback(
		(row: number, col: number) => {
			if (roomId && wsStatus !== "connected") return;
			if (roomId && !isMyTurn) return;
			if (promoteDialog) return;

			const cell = board[row][col];

			// 持ち駒選択中
			if (selectedHandPiece) {
				if (isLegalDropTarget(row, col)) {
					executeDrop(selectedHandPiece, { row, col });
				} else if (cell && cell.side === mySide) {
					setSelectedHandPiece(null);
					setSelected({ row, col });
				} else {
					setSelectedHandPiece(null);
				}
				return;
			}

			// 盤上の駒選択中
			if (selected) {
				if (cell && cell.side === mySide) {
					setSelected({ row, col });
					return;
				}

				const targetInfo = getLegalTargetInfo(row, col);
				if (targetInfo) {
					const from = { row: selected.row, col: selected.col };
					const to = { row, col };

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
					setSelected({ row, col });
					setSelectedHandPiece(null);
				}
			}
		},
		[
			board, selected, selectedHandPiece, mySide, turn, isMyTurn,
			roomId, wsStatus, promoteDialog,
			isLegalDropTarget, getLegalTargetInfo, executeMove, executeDrop,
			setSelected, setSelectedHandPiece, setPromoteDialog
		]
	);

	const handleHandPieceClick = useCallback(
		(kanji: string) => {
			if (roomId && wsStatus !== "connected") return;
			if (roomId && !isMyTurn) return;
			if (promoteDialog) return;
			if (turn !== mySide) return;

			setSelected(null);
			setSelectedHandPiece((prev) => (prev === kanji ? null : kanji));
		},
		[roomId, wsStatus, isMyTurn, promoteDialog, turn, mySide, setSelected, setSelectedHandPiece]
	);

	const handleEndMatch = useCallback(() => {
		router.push("/result" + (roomId ? `?roomId=${roomId}` : ""));
	}, [router, roomId]);

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
		handleCellClick,
		handleHandPieceClick,
		handleEndMatch,
	};
}