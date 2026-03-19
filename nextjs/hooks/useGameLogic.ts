import { useCallback, useReducer, useEffect, useMemo } from "react";
import { INITIAL_BOARD, INITIAL_HAND } from "@/utils/shogiConstants";
import { useLegalMoves } from "./useLegalMoves";
import { hasLegalMoves, boardFromPieces, type PieceInfo } from "@/lib/shogi/board";
import { Color, PType } from "@/lib/shogi/types"; // For check detection
import { gameReducer, GameAction } from "./reducers/gameReducer";
import { PieceData, GameState, Pos } from "@/lib/shogi/types";

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

	// ========= 王手判定 =========
	const isCheck = useMemo(() => {
		if (state.gameResult.isOver) return false;
		const boardObj = boardFromPieces(
			state.board as (PieceInfo | null)[][],
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

		// Check status
		isCheck,

		// Legal Moves
		...legalMoves,
	};
}
