import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);
import fs from "fs";

function getEnginePath(): string {
    const devPath = path.join(process.cwd(), "..", "55engine", "engine");
    
    if (fs.existsSync(devPath)) {
        return devPath;
    } else if (fs.existsSync(devPathExe)) {
        return devPathExe;
    }

    return devPath;
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { sfen, depth = 4 } = body;

		if (!sfen || typeof sfen !== "string") {
			return NextResponse.json(
				{ error: "sfenパラメータが必要です" },
				{ status: 400 }
			);
		}

		const enginePath = getEnginePath();

		const { stdout, stderr } = await execFileAsync(
			enginePath,
			[sfen, String(depth)],
			{ timeout: 10000 } // 10秒タイムアウト
		);

		if (stderr) {
			console.error("[Engine stderr]", stderr);
		}

		// 出力: "bestmove 5a4b+" or "bestmove resign"
		const output = stdout.trim();
		const match = output.match(/^bestmove\s+(.+)$/);

		if (!match) {
			return NextResponse.json(
				{ error: "エンジンの出力が不正です", raw: output },
				{ status: 500 }
			);
		}

		const bestmove = match[1];

		if (bestmove === "resign") {
			return NextResponse.json({ bestmove: null, resign: true });
		}

		// パース: "5a4b+" → { from: "5a", to: "4b", promote: true }
		// パース: "P*3c" → { drop: "P", to: "3c" }
		const moveStr = bestmove;
		let parsed: {
			from?: { row: number; col: number };
			to: { row: number; col: number };
			promote?: boolean;
			drop?: string;
		};

		if (moveStr[1] === "*") {
			// 打ち: "P*3c"
			const dropPiece = moveStr[0];
			const toFile = parseInt(moveStr[2]);
			const toRank = moveStr[3];
			const toCol = 5 - toFile;
			const toRow = toRank.charCodeAt(0) - "a".charCodeAt(0);

			parsed = {
				drop: dropPiece,
				to: { row: toRow, col: toCol },
			};
		} else {
			// 移動: "5a4b" or "5a4b+"
			const fromFile = parseInt(moveStr[0]);
			const fromRank = moveStr[1];
			const toFile = parseInt(moveStr[2]);
			const toRank = moveStr[3];
			const promote = moveStr.length >= 5 && moveStr[4] === "+";

			const fromCol = 5 - fromFile;
			const fromRow = fromRank.charCodeAt(0) - "a".charCodeAt(0);
			const toCol = 5 - toFile;
			const toRow = toRank.charCodeAt(0) - "a".charCodeAt(0);

			parsed = {
				from: { row: fromRow, col: fromCol },
				to: { row: toRow, col: toCol },
				promote,
			};
		}

		return NextResponse.json({
			bestmove: moveStr,
			parsed,
			resign: false,
		});
	} catch (error: unknown) {
		console.error("[Engine error]", error);
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json(
			{ error: "エンジンの実行に失敗しました", detail: message },
			{ status: 500 }
		);
	}
}
