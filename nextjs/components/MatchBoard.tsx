"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

// 5×5 Shogi initial position
// Rows top to bottom: Gote's side → Sente's side
type PieceData = {
	kanji: string;
	side: "sente" | "gote";
} | null;

const INITIAL_BOARD: PieceData[][] = [
	// Row 0 (Gote's back rank)
	[
		{ kanji: "王", side: "gote" },
		{ kanji: "金", side: "gote" },
		{ kanji: "銀", side: "gote" },
		{ kanji: "角", side: "gote" },
		{ kanji: "飛", side: "gote" },
	],
	// Row 1 (Gote's pawn)
	[
		null,
		null,
		null,
		null,
		{ kanji: "歩", side: "gote" },
	],
	// Row 2 (empty)
	[null, null, null, null, null],
	// Row 3 (Sente's pawn)
	[
		{ kanji: "歩", side: "sente" },
		null,
		null,
		null,
		null,
	],
	// Row 4 (Sente's back rank)
	[
		{ kanji: "飛", side: "sente" },
		{ kanji: "角", side: "sente" },
		{ kanji: "銀", side: "sente" },
		{ kanji: "金", side: "sente" },
		{ kanji: "王", side: "sente" },
	],
];

function PieceComponent({ piece }: { piece: PieceData }) {
	if (!piece) return null;

	return (
		<div className={`piece piece-${piece.side}`}>
			<div className="piece-inner">{piece.kanji}</div>
		</div>
	);
}

interface MatchBoardProps {
	roomId?: string;
}

function MatchBoard({ roomId }: MatchBoardProps) {
	const router = useRouter();

	const handleEndMatch = () => {
		router.push("/result" + (roomId ? `?roomId=${roomId}` : ""));
	};

	return (
		<div>
			<header className="header">
				<Link
					href="/home"
					className="header-logo"
					style={{ textDecoration: "none" }}
				>
					🐯 虎戦
				</Link>
				{roomId && (
					<span className="text-muted text-sm">ルーム: {roomId}</span>
				)}
			</header>

			<div className="page page-top">
				<div className="board-container">
					{/* Gote player info */}
					<div className="board-player-info">
						<span className="board-player-badge badge-gote">後手</span>
						<span>対戦相手</span>
					</div>

					{/* 5×5 Board */}
					<div className="board">
						{INITIAL_BOARD.flatMap((row, rowIdx) =>
							row.map((cell, colIdx) => (
								<div
									key={`${rowIdx}-${colIdx}`}
									className="board-cell"
								>
									<PieceComponent piece={cell} />
								</div>
							))
						)}
					</div>

					{/* Sente player info */}
					<div className="board-player-info">
						<span className="board-player-badge badge-sente">先手</span>
						<span>あなた</span>
					</div>

					{/* End match button */}
					<button
						className="btn btn-danger btn-lg mt-24"
						onClick={handleEndMatch}
					>
						対局を終える
					</button>
				</div>
			</div>
		</div>
	);
}

export default MatchBoard;
export { MatchBoard };
