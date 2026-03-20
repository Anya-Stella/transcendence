import { HandPieces, PieceData, UIBoard } from "./types";

export function sfenToUIBoard(sfen: string): UIBoard {
  const parts = sfen.trim().split(/\s+/);
  if (parts.length < 3) {
    throw new Error("Invalid SFEN format");
  }

  const [boardStr, turnStr, handStr] = parts;

  // 1. 手番の判定
  const turn: "sente" | "gote" = turnStr === "b" ? "sente" : "gote";

  // 2. 盤面のパース (5x5)
  const board: (PieceData | null)[][] = Array.from({ length: 5 }, () =>
    new Array(5).fill(null)
  );

  const charToKanji: Record<string, string> = {
    p: "歩", s: "銀", g: "金", b: "角", r: "飛", k: "玉",
    "+p": "と", "+s": "全", "+b": "馬", "+r": "龍",
  };

  let row = 0;
  let col = 0;
  let promoteNext = false;

  for (const char of boardStr) {
    if (char === "/") {
      row++;
      col = 0;
    } else if (/[1-5]/.test(char)) {
      col += parseInt(char, 10);
    } else if (char === "+") {
      promoteNext = true;
    } else {
      const isSente = char === char.toUpperCase();
      const lowerChar = char.toLowerCase();
      const key = promoteNext ? `+${lowerChar}` : lowerChar;
      
      board[row][col] = {
        kanji: charToKanji[key] || "？",
        side: isSente ? "sente" : "gote",
      };
      
      col++;
      promoteNext = false;
    }
  }

  // 3. 持ち駒のパース
  const senteHand: HandPieces = { "歩": 0, "銀": 0, "金": 0, "角": 0, "飛": 0 };
  const goteHand: HandPieces = { "歩": 0, "銀": 0, "金": 0, "角": 0, "飛": 0 };

  if (handStr !== "-") {
    let count = 0;
    for (const char of handStr) {
      if (/[0-9]/.test(char)) {
        count = count * 10 + parseInt(char, 10);
      } else {
        const num = count === 0 ? 1 : count;
        const isSente = char === char.toUpperCase();
        const kanji = charToKanji[char.toLowerCase()] || "？";
        
        if (isSente) senteHand[kanji] = num;
        else goteHand[kanji] = num;
        
        count = 0; // リセット
      }
    }
  }

  return {
    board,
    senteHand,
    goteHand,
    turn,
  };
}