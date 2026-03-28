// 駒の位置が盤外（駒台）かどうかを判定する
export function checkIsHandPos(pos: [number, number, number]): boolean {
	// 盤の範囲 X:[3.9, -9.1] Z:[-6.4, 6.4] から外れているか判定
	return pos[0] > 5.0 || pos[0] < -10.0 || pos[2] > 7.0 || pos[2] < -7.0;
}