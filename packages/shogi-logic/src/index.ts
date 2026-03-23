export type {
    Bitboard,
    BitMove,
    PieceData,
    UIBoard,
    Move,
    Drop,
    Pos,
    Square,
    HandPieces,
    GameState,
    Piece,
    BoardState,
    Hand,
} from "./types"

export {
    Color,
    PType,
    PieceType,
    PromotedPieceType,
} from "./types"

export {
    USI_TO_DROP_KANJI,
    PROMOTE_MAP,
    DEMOTE_MAP,
    INITIAL_BOARD,
    INITIAL_HAND,
} from "./shogiConstants"

export {
    apply,
    hasLegalMoves,
    getLegalMovesForPiece,
    getLegalDrops,
    generateLegalMoves,
    isLegalMove,
    applyMove,
    type LegalTarget,
    type PieceInfo,
    boardFromPieces
} from "./board"

export { sfenToUIBoard } from "./sfenToUIBoard"
export { createInitialBoard, UNPROMOTE_MAP } from "./constants"