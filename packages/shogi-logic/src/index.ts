// ============================================================
// @torassen/shogi-logic — Public API barrel
// ============================================================

// Types
export {
	Color,
	PieceType,
	PromotedPieceType,
	GameResult,
} from "./types";

export type {
	AnyPieceType,
	Piece,
	Square,
	BoardMove,
	DropMove,
	Move,
	Hand,
	BoardState,
} from "./types";

// Constants
export {
	BOARD_SIZE,
	INITIAL_SFEN,
	PROMOTION_MAP,
	UNPROMOTE_MAP,
	PIECE_DISPLAY_NAMES,
	PIECE_TO_SFEN,
	emptyHand,
	createInitialBoard,
} from "./constants";

// Board utilities
export {
	isInBounds,
	squareEquals,
	cloneBoardState,
	opponentColor,
	applyMove,
	findKing,
} from "./board";

// Legal move logic
export {
	isSquareAttackedBy,
	isInCheck,
	generateLegalMoves,
	isLegalMove,
	isCheckmate,
	isStalemate,
} from "./legal-moves";
