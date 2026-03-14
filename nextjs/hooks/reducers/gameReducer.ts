import { PROMOTE_MAP, DEMOTE_MAP } from "@/utils/shogiConstants";
import { PieceData, GameState,Pos } from "@/lib/shogi/types";

export type GameAction =
	| { type: "SELECT_CELL"; payload: { row: number; col: number } }
	| { type: "SELECT_HAND"; payload: string | null}
	| { type: "DESELECT" }
	| { type: "SET_PROMOTE_DIALOG"; payload: { from: { row: number; col: number }; to: { row: number; col: number } } | null }
	| { type: "APPLY_MOVE"; payload: { from: { row: number; col: number }; to: { row: number; col: number }; promote: boolean } }
	| { type: "APPLY_DROP"; payload: { kanji: string; to: { row: number; col: number }; side: "sente" | "gote" } }
	| { type: "SET_GAME_OVER"; payload: { winner: "sente" | "gote" | "draw"; message: string } };

function deepCopyBoard(board: PieceData[][]): PieceData[][] {
	return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function gameReducer(state: GameState, action: GameAction): GameState {
	switch (action.type) {
		case "SELECT_CELL":
			return { ...state, selected: action.payload, selectedHandPiece: null };

		case "SELECT_HAND":
			return {
				...state,
				selected: action.payload === null ? state.selected : null,
				selectedHandPiece: state.selectedHandPiece === action.payload ? null : action.payload,
			};

		case "DESELECT":
			return { ...state, selected: null, selectedHandPiece: null, promoteDialog: null };

		case "SET_PROMOTE_DIALOG":
			return { ...state, promoteDialog: action.payload };

		case "SET_GAME_OVER":
			return {
				...state,
				gameResult: {
					isOver: true,
					winner: action.payload.winner,
					message: action.payload.message,
				},
				selected: null,
				selectedHandPiece: null,
			};

		case "APPLY_MOVE": {
			const { from, to, promote } = action.payload;
			const nextBoard = deepCopyBoard(state.board);
			const movingPiece = nextBoard[from.row][from.col];

			if (!movingPiece) return state; // invalid move

			let nextSenteHand = { ...state.senteHand };
			let nextGoteHand = { ...state.goteHand };

			// Capture
			const captured = nextBoard[to.row][to.col];
			if (captured && captured.side !== movingPiece.side) {
				let kanji = captured.kanji;
				if (DEMOTE_MAP[kanji]) {
					kanji = DEMOTE_MAP[kanji];
				}
				if (kanji !== "王" && kanji !== "玉") {
					if (movingPiece.side === "sente") {
						nextSenteHand[kanji] = (nextSenteHand[kanji] || 0) + 1;
					} else {
						nextGoteHand[kanji] = (nextGoteHand[kanji] || 0) + 1;
					}
				}
			}

			// Move
			nextBoard[to.row][to.col] = { ...movingPiece };
			nextBoard[from.row][from.col] = null;

			// Promote
			if (promote && PROMOTE_MAP[movingPiece.kanji]) {
				nextBoard[to.row][to.col] = {
					kanji: PROMOTE_MAP[movingPiece.kanji],
					side: movingPiece.side,
				};
			}

			return {
				...state,
				board: nextBoard,
				senteHand: nextSenteHand,
				goteHand: nextGoteHand,
				turn: state.turn === "sente" ? "gote" : "sente",
				selected: null,
				promoteDialog: null,
			};
		}

		case "APPLY_DROP": {
			const { kanji, to, side } = action.payload;
			const nextBoard = deepCopyBoard(state.board);
			let nextSenteHand = { ...state.senteHand };
			let nextGoteHand = { ...state.goteHand };

			// Remove from hand
			if (side === "sente") {
				nextSenteHand[kanji] = (nextSenteHand[kanji] || 0) - 1;
				if (nextSenteHand[kanji] <= 0) delete nextSenteHand[kanji];
			} else {
				nextGoteHand[kanji] = (nextGoteHand[kanji] || 0) - 1;
				if (nextGoteHand[kanji] <= 0) delete nextGoteHand[kanji];
			}

			// Place on board
			nextBoard[to.row][to.col] = { kanji, side };

			return {
				...state,
				board: nextBoard,
				senteHand: nextSenteHand,
				goteHand: nextGoteHand,
				turn: state.turn === "sente" ? "gote" : "sente",
				selected: null,
				selectedHandPiece: null,
			};
		}

		default:
			return state;
	}
}
