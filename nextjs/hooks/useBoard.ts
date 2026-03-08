// hooks/useBoard.ts
export function useBoard(initialBoard: PieceData[][]) {
    const [board, setBoard] = useState(deepCopyBoard(initialBoard));

    const movePiece = useCallback((from, to, promote) => {
        setBoard(prev => {
            const next = deepCopyBoard(prev);
            const piece = next[from.row][from.col];
            // ...駒取りの判定ロジック...
            next[to.row][to.col] = promote ? { kanji: PROMOTE_MAP[piece.kanji], ... } : piece;
            next[from.row][from.col] = null;
            return next;
        });
    }, []);

    const dropPiece = useCallback((kanji, to, side) => {
        setBoard(prev => {
            const next = deepCopyBoard(prev);
            next[to.row][to.col] = { kanji, side };
            return next;
        });
    }, []);

    return { board, movePiece, dropPiece };
}