import { useCallback, useReducer, useEffect, useMemo } from "react";
import { useLegalMoves } from "./useLegalMoves";
import { gameReducer, GameAction } from "./reducers/gameReducer";
import { PlayerSide } from "@/types/game";
import {
	PieceData,
	GameState,
	Pos,
	UIBoard,
	INITIAL_BOARD,
	INITIAL_HAND,
	hasLegalMoves,
	boardFromPieces,
	Color,
	PType,
	type PieceInfo
} from "@torassen/shogi-logic";

export function useGameLogic(mySide: PlayerSide) {
	function deepCopyBoard(board: PieceData[][]): PieceData[][] {
		return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
	}

	const initialState: GameState = {
		board: deepCopyBoard(INITIAL_BOARD),
		senteHand: { ...INITIAL_HAND },
		goteHand: { ...INITIAL_HAND },
		turn: "sente",
		selected: null,
		selectedHandPiece: null,
		promoteDialog: null,
		gameResult: { isOver: false, winner: null, message: null },
	};

	const [state, dispatch] = useReducer(gameReducer, initialState);

	const isMyTurn = state.turn === mySide;

	// ========= 合法手計算 =========
	const legalMoves = useLegalMoves(
		state.board,
		state.turn,
		state.senteHand,
		state.goteHand,
		state.selected,
		state.selectedHandPiece
	);

	// ========= 王手判定 =========
	const isCheck = useMemo(() => {
		if (state.gameResult.isOver) return false;
		const boardObj = boardFromPieces(
			state.board as any,
			state.turn,
			state.senteHand,
			state.goteHand
		);
		const currentSTM = boardObj.sideToMove;
		const opponent = (1 - currentSTM) as Color;
		const occ = boardObj.colorBB[0] | boardObj.colorBB[1];

		// 相手の攻撃範囲を取得
		const oppAttacks = boardObj.getAttacks(opponent, occ);
		// 自分の玉の位置
		const myKing = boardObj.colorBB[currentSTM] & boardObj.pieceBB[PType.KING];

		return (oppAttacks & myKing) !== 0;
	}, [state.board, state.turn, state.senteHand, state.goteHand, state.gameResult.isOver]);

	// ========= 詰み判定 =========
	useEffect(() => {
		if (state.gameResult.isOver) return;

		// 合法手があるか確認
		const canMove = hasLegalMoves(
			state.board as any,
			state.turn,
			state.senteHand,
			state.goteHand
		);

		// 王手がかかっているか確認
		// 一般的な将棋では詰み＝王手がかかっていて合法手がない状態
		if (!canMove) {
			const winner = state.turn === "sente" ? "gote" : "sente";
			const isWin = winner === mySide;

			const mainMessage = isCheck ? "詰みです！" : "合法手がありません。";
			const resultMessage = mySide === "spectator" 
				? `${winner === "sente" ? "先手" : "後手"}の勝ちです！`
				: (winner === mySide ? "あなたの勝ちです！" : "あなたの負けです。");

			dispatch({
				type: "SET_GAME_OVER",
				payload: {
					winner,
					message: `${mainMessage}${resultMessage}`
				},
			});
		}
	}, [state.turn, state.board, state.senteHand, state.goteHand, state.gameResult.isOver, isCheck, mySide]);

	// ========= Actions wrapper =========
	const applyMove = (
		(from: { row: number; col: number }, to: { row: number; col: number }, promote: boolean) => {
			dispatch({ type: "APPLY_MOVE", payload: { from, to, promote } });
		}
	);

	const applyDrop = (
		(kanji: string, to: Pos, side: "sente" | "gote") => {
			dispatch({ type: "APPLY_DROP", payload: { kanji, to, side } });
		}
	);

	const setSelected = ((cell: Pos | null) => {
		if (cell) dispatch({ type: "SELECT_CELL", payload: cell });
		else dispatch({ type: "DESELECT" });
	});

	const setSelectedHandPiece = ((kanji: string | null) => {
		dispatch({ type: "SELECT_HAND", payload: kanji });
	});

	const setPromoteDialog = ((dialog: { from: { row: number; col: number }; to: { row: number; col: number } } | null) => {
		dispatch({ type: "SET_PROMOTE_DIALOG", payload: dialog });
	});

	const setGameResult = ((result: { isOver: boolean; winner: "sente" | "gote" | "draw" | null; message: string | null }) => {
		if (result.isOver && result.winner) {
			dispatch({ type: "SET_GAME_OVER", payload: { winner: result.winner, message: result.message || "" } });
		} 
	});

	const syncBoardState = (syncedBoard: UIBoard) => {
		dispatch({ type: "SYNC_STATE", payload: syncedBoard });
	};

	return {
		// State
		...state,
		isMyTurn,

		// Actions
		setSelected,
		setSelectedHandPiece,
		setPromoteDialog,
		setGameResult,
		applyMove,
		applyDrop,
		syncBoardState,

		// Check status
		isCheck,

		// Legal Moves
		...legalMoves,
	};
}
