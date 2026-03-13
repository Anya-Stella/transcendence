// ============================================================
// @torassen/shogi-logic — Legal move generation / validation
// ============================================================

import {
	Color,
	PieceType,
	PromotedPieceType,
	type AnyPieceType,
	type Piece,
	type BoardState,
	type Square,
	type Move,
	type BoardMove,
	type DropMove,
} from "./types";
import { BOARD_SIZE, PROMOTION_MAP } from "./constants";
import { isInBounds, applyMove, findKing, opponentColor } from "./board";

// ─── Direction Tables ─────────────────────────────────────

/** [dRow, dCol] */
type Dir = [number, number];

const DIR_UP: Dir = [-1, 0];
const DIR_DOWN: Dir = [1, 0];
const DIR_LEFT: Dir = [0, -1];
const DIR_RIGHT: Dir = [0, 1];
const DIR_UL: Dir = [-1, -1];
const DIR_UR: Dir = [-1, 1];
const DIR_DL: Dir = [1, -1];
const DIR_DR: Dir = [1, 1];

const ALL_DIRS: Dir[] = [DIR_UP, DIR_DOWN, DIR_LEFT, DIR_RIGHT, DIR_UL, DIR_UR, DIR_DL, DIR_DR];
const ORTHOGONAL: Dir[] = [DIR_UP, DIR_DOWN, DIR_LEFT, DIR_RIGHT];
const DIAGONAL: Dir[] = [DIR_UL, DIR_UR, DIR_DL, DIR_DR];

/** 各駒のステップ移動方向 (color=BLACK 基準, WHITE は上下反転) */
function getStepDirs(pieceType: AnyPieceType, color: Color): Dir[] {
	const sign = color === Color.BLACK ? 1 : -1; // BLACK は上へ (-row), WHITE は下へ (+row)

	switch (pieceType) {
		case PieceType.PAWN:
			return [[-1 * sign, 0]];
		case PieceType.SILVER:
			return [
				[-1 * sign, 0],
				[-1 * sign, -1],
				[-1 * sign, 1],
				[1 * sign, -1],
				[1 * sign, 1],
			];
		case PieceType.GOLD:
		case PromotedPieceType.PRO_PAWN:
		case PromotedPieceType.PRO_SILVER:
			return [
				[-1 * sign, 0],
				[-1 * sign, -1],
				[-1 * sign, 1],
				[0, -1],
				[0, 1],
				[1 * sign, 0],
			];
		case PieceType.KING:
			return ALL_DIRS;
		default:
			return [];
	}
}

/** スライダー駒の移動方向 */
function getSlideDirs(pieceType: AnyPieceType): Dir[] {
	switch (pieceType) {
		case PieceType.ROOK:
			return ORTHOGONAL;
		case PieceType.BISHOP:
			return DIAGONAL;
		case PromotedPieceType.PRO_ROOK:
			return ORTHOGONAL; // スライドは直線のみ、ステップで斜め短追加
		case PromotedPieceType.PRO_BISHOP:
			return DIAGONAL;
		default:
			return [];
	}
}

/** 龍・馬のボーナスステップ方向 */
function getBonusStepDirs(pieceType: AnyPieceType): Dir[] {
	switch (pieceType) {
		case PromotedPieceType.PRO_ROOK:
			return DIAGONAL; // 龍: 斜め 1 マス
		case PromotedPieceType.PRO_BISHOP:
			return ORTHOGONAL; // 馬: 十字 1 マス
		default:
			return [];
	}
}

// ─── Attack Check ─────────────────────────────────────────

/**
 * 指定マスが指定色の駒に攻撃されているか
 */
export function isSquareAttackedBy(state: BoardState, sq: Square, byColor: Color): boolean {
	for (let row = 0; row < BOARD_SIZE; row++) {
		for (let col = 0; col < BOARD_SIZE; col++) {
			const piece = state.board[row][col];
			if (!piece || piece.color !== byColor) continue;

			// Step attacks
			const stepDirs = getStepDirs(piece.pieceType, byColor);
			for (const [dr, dc] of stepDirs) {
				if (row + dr === sq.row && col + dc === sq.col) return true;
			}

			// Slide attacks
			const slideDirs = getSlideDirs(piece.pieceType);
			for (const [dr, dc] of slideDirs) {
				let r = row + dr;
				let c = col + dc;
				while (isInBounds(r, c)) {
					if (r === sq.row && c === sq.col) return true;
					if (state.board[r][c]) break; // 途中に駒がある
					r += dr;
					c += dc;
				}
			}

			// Bonus step (龍・馬)
			const bonusDirs = getBonusStepDirs(piece.pieceType);
			for (const [dr, dc] of bonusDirs) {
				if (row + dr === sq.row && col + dc === sq.col) return true;
			}
		}
	}
	return false;
}

/** 指定色の玉が王手されているか */
export function isInCheck(state: BoardState, color: Color): boolean {
	const kingSq = findKing(state, color);
	if (!kingSq) return false;
	return isSquareAttackedBy(state, kingSq, opponentColor(color));
}

// ─── Pseudo-Legal Move Generation ─────────────────────────

/**
 * 疑似合法手を生成する（自玉が取られる手も含む）。
 * 完全な合法手は generateLegalMoves() を使用。
 */
function generatePseudoLegalMoves(state: BoardState): Move[] {
	const moves: Move[] = [];
	const me = state.sideToMove;

	// 盤上の駒の移動
	for (let row = 0; row < BOARD_SIZE; row++) {
		for (let col = 0; col < BOARD_SIZE; col++) {
			const piece = state.board[row][col];
			if (!piece || piece.color !== me) continue;

			const from: Square = { row, col };

			// Step moves
			const stepDirs = getStepDirs(piece.pieceType, me);
			for (const [dr, dc] of stepDirs) {
				const toRow = row + dr;
				const toCol = col + dc;
				if (!isInBounds(toRow, toCol)) continue;
				const target = state.board[toRow][toCol];
				if (target && target.color === me) continue; // 自駒
				const to: Square = { row: toRow, col: toCol };
				addBoardMoves(moves, from, to, piece, me);
			}

			// Slide moves
			const slideDirs = getSlideDirs(piece.pieceType);
			for (const [dr, dc] of slideDirs) {
				let r = row + dr;
				let c = col + dc;
				while (isInBounds(r, c)) {
					const target = state.board[r][c];
					if (target && target.color === me) break;
					const to: Square = { row: r, col: c };
					addBoardMoves(moves, from, to, piece, me);
					if (target) break; // 相手駒を取ったら止まる
					r += dr;
					c += dc;
				}
			}

			// Bonus step (龍・馬)
			const bonusDirs = getBonusStepDirs(piece.pieceType);
			for (const [dr, dc] of bonusDirs) {
				const toRow = row + dr;
				const toCol = col + dc;
				if (!isInBounds(toRow, toCol)) continue;
				const target = state.board[toRow][toCol];
				if (target && target.color === me) continue;
				const to: Square = { row: toRow, col: toCol };
				// 成り駒なのでさらなる成りはない
				moves.push({ type: "move", from, to, promote: false });
			}
		}
	}

	// 持ち駒を打つ
	for (const pt of [PieceType.PAWN, PieceType.SILVER, PieceType.GOLD, PieceType.BISHOP, PieceType.ROOK]) {
		if ((state.hands[me][pt] || 0) <= 0) continue;

		for (let row = 0; row < BOARD_SIZE; row++) {
			for (let col = 0; col < BOARD_SIZE; col++) {
				if (state.board[row][col]) continue; // 既に駒がある

				// 歩の制約
				if (pt === PieceType.PAWN) {
					// 行き所のない駒の禁止
					if (me === Color.BLACK && row === 0) continue;
					if (me === Color.WHITE && row === BOARD_SIZE - 1) continue;

					// 二歩チェック
					if (hasUnpromotedPawnOnFile(state, me, col)) continue;
				}

				moves.push({ type: "drop", pieceType: pt, to: { row, col } });
			}
		}
	}

	return moves;
}

/** 盤上移動で成り / 不成の手を追加 */
function addBoardMoves(moves: Move[], from: Square, to: Square, piece: Piece, color: Color): void {
	const canPromote = canPiecePromote(piece.pieceType, from, to, color);
	const mustPromote = mustPiecePromote(piece.pieceType, to, color);

	if (canPromote) {
		moves.push({ type: "move", from, to, promote: true });
		if (!mustPromote) {
			moves.push({ type: "move", from, to, promote: false });
		}
	} else {
		moves.push({ type: "move", from, to, promote: false });
	}
}

/** 成れるかどうか */
function canPiecePromote(pt: AnyPieceType, from: Square, to: Square, color: Color): boolean {
	// 既に成り駒、金、玉は成れない
	if (pt === PieceType.KING || pt === PieceType.GOLD) return false;
	if (PROMOTION_MAP[pt] === undefined) return false;

	const promoRank = color === Color.BLACK ? 0 : BOARD_SIZE - 1;
	return from.row === promoRank || to.row === promoRank;
}

/** 成り必須かどうか (行き所のない駒) */
function mustPiecePromote(pt: AnyPieceType, to: Square, color: Color): boolean {
	if (pt === PieceType.PAWN) {
		return (color === Color.BLACK && to.row === 0) || (color === Color.WHITE && to.row === BOARD_SIZE - 1);
	}
	return false;
}

/** 指定筋に未成の歩があるか (二歩チェック) */
function hasUnpromotedPawnOnFile(state: BoardState, color: Color, col: number): boolean {
	for (let row = 0; row < BOARD_SIZE; row++) {
		const piece = state.board[row][col];
		if (piece && piece.color === color && piece.pieceType === PieceType.PAWN) {
			return true;
		}
	}
	return false;
}

// ─── Legal Move Generation ────────────────────────────────

/**
 * 合法手を生成する。
 * 自玉が王手放置にならない手のみを返す。
 */
export function generateLegalMoves(state: BoardState): Move[] {
	const pseudoMoves = generatePseudoLegalMoves(state);
	const me = state.sideToMove;

	return pseudoMoves.filter((move) => {
		const nextState = applyMove(state, move);
		return !isInCheck(nextState, me);
	});
}

/**
 * 指定された手が合法かどうか判定する。
 */
export function isLegalMove(state: BoardState, move: Move): boolean {
	const legalMoves = generateLegalMoves(state);

	return legalMoves.some((lm) => {
		if (lm.type !== move.type) return false;
		if (lm.type === "drop" && move.type === "drop") {
			return lm.pieceType === move.pieceType && lm.to.row === move.to.row && lm.to.col === move.to.col;
		}
		if (lm.type === "move" && move.type === "move") {
			return (
				lm.from.row === move.from.row &&
				lm.from.col === move.from.col &&
				lm.to.row === move.to.row &&
				lm.to.col === move.to.col &&
				lm.promote === move.promote
			);
		}
		return false;
	});
}

/**
 * 詰みかどうか判定する。
 * 自分の手番で合法手が 0 かつ王手されている場合に詰み。
 */
export function isCheckmate(state: BoardState): boolean {
	if (!isInCheck(state, state.sideToMove)) return false;
	return generateLegalMoves(state).length === 0;
}

/**
 * ステイルメイトかどうか判定する。
 * 合法手が 0 だが王手されていない場合。
 */
export function isStalemate(state: BoardState): boolean {
	if (isInCheck(state, state.sideToMove)) return false;
	return generateLegalMoves(state).length === 0;
}
