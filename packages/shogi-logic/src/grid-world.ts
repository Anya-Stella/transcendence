import { BOARD_X_COORDS, BOARD_Y, BOARD_Z_COORDS } from "./constants";

// グリッド座標 → 3D ワールド座標
export function gridToWorld(row: number, col: number, isFlipped: boolean = false): [number, number, number] {
	const r = isFlipped ? 4 - row : row;
	const c = isFlipped ? 4 - col : col;
	return [
		BOARD_X_COORDS[r],
		BOARD_Y,
		BOARD_Z_COORDS[c]
	];
}

// 3D ワールド座標 → 最も近いグリッド座標
export function worldToGrid(x: number, z: number, isFlipped: boolean = false): { row: number; col: number } | null {
	// 最も近いX座標のインデックスを探す
	let bestRow = 0;
	let minXDist = Math.abs(x - BOARD_X_COORDS[0]);
	for (let i = 1; i < BOARD_X_COORDS.length; i++) {
		const dist = Math.abs(x - BOARD_X_COORDS[i]);
		if (dist < minXDist) {
			minXDist = dist;
			bestRow = i;
		}
	}

	// 最も近いZ座標のインデックスを探す
	let bestCol = 0;
	let minZDist = Math.abs(z - BOARD_Z_COORDS[0]);
	for (let i = 1; i < BOARD_Z_COORDS.length; i++) {
		const dist = Math.abs(z - BOARD_Z_COORDS[i]);
		if (dist < minZDist) {
			minZDist = dist;
			bestCol = i;
		}
	}

	// 盤面の外（閾値以上離れている）ならnullを返す
	// BOARD_X_COORDS: [3.9, ..., -9.1], BOARD_Z_COORDS: [-6.4, ..., 6.4]
	const margin = 2.0;
	const minX = -9.1 - margin;
	const maxX = 3.9 + margin;
	const minZ = -6.4 - margin;
	const maxZ = 6.4 + margin;

	if (x < minX || x > maxX || z < minZ || z > maxZ) {
		return null;
	}

	if (isFlipped) {
		return { row: 4 - bestRow, col: 4 - bestCol };
	}
	return { row: bestRow, col: bestCol };
}