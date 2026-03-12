import { useCallback, useReducer, useEffect } from "react";
import { INITIAL_BOARD, INITIAL_HAND, PieceData } from "@/utils/shogiConstants";
import { useLegalMoves } from "./useLegalMoves";
import { hasLegalMoves, type PieceInfo } from "@/lib/shogi/board";
import { gameReducer, GameState, GameAction } from "./reducers/gameReducer";

export function useGameLogic(mySide: "sente" | "gote") {
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

	// ========= 詰み判定 =========
	useEffect(() => {
		if (state.gameResult.isOver) return;

		const canMove = hasLegalMoves(
			state.board as (PieceInfo | null)[][],
			state.turn,
			state.senteHand,
			state.goteHand
		);

		if (!canMove) {
			const winner = state.turn === "sente" ? "gote" : "sente";
			const winnerDisplay = winner === mySide ? "あなた" : "相手";
			dispatch({
				type: "SET_GAME_OVER",
				payload: { winner, message: `詰みです！${winnerDisplay}の勝ちです。` },
			});
		}
	}, [state.turn, state.board, state.senteHand, state.goteHand, mySide, state.gameResult.isOver]);

	// ========= Actions wrapper =========
	const applyMove = (
		(from: { row: number; col: number }, to: { row: number; col: number }, promote: boolean) => {
			dispatch({ type: "APPLY_MOVE", payload: { from, to, promote } });
		}
	);

	const applyDrop = (
		(kanji: string, to: { row: number; col: number }, side: "sente" | "gote") => {
			dispatch({ type: "APPLY_DROP", payload: { kanji, to, side } });
		}
	);

	const setSelected = ((cell: { row: number; col: number } | null) => {
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

		// Legal Moves
		...legalMoves,
	};
}
