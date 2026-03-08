// hooks/useHands.ts
export function useHands() {
    const [senteHand, setSenteHand] = useState<HandPieces>({ ...INITIAL_HAND });
    const [goteHand, setGoteHand] = useState<HandPieces>({ ...INITIAL_HAND });

    const addCapturedPiece = useCallback((kanji, side) => {
        const base = DEMOTE_MAP[kanji] || kanji;
        const setHand = side === "sente" ? setSenteHand : setGoteHand;
        setHand(prev => ({ ...prev, [base]: (prev[base] || 0) + 1 }));
    }, []);

    const removeHandPiece = useCallback((kanji, side) => {
        const setHand = side === "sente" ? setSenteHand : setGoteHand;
        setHand(prev => {
            const next = { ...prev };
            next[kanji]--;
            if (next[kanji] <= 0) delete next[kanji];
            return next;
        });
    }, []);

    return { senteHand, goteHand, addCapturedPiece, removeHandPiece };
}