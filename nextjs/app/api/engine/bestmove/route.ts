import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execFileAsync = promisify(execFile);

// C++エンジンのパスを探す（Linux前提）
function findEnginePath(): string | null {
	const candidates = [
		path.join(process.cwd(), "engine", "55engine"),        // Docker production
		path.join(process.cwd(), "..", "55engine", "engine"),   // Linux dev
		path.join(process.cwd(), "..", "55engine", "55engine"), // Linux dev alt
	];

	for (const p of candidates) {
		try {
			fs.accessSync(p, fs.constants.X_OK);
			return p;
		} catch {
			// not accessible
		}
	}
	return null;
}

// ========= 手をパース =========

function parseMoveString(moveStr: string) {
	if (moveStr[1] === "*") {
		const toFile = parseInt(moveStr[2]);
		const toRank = moveStr[3];
		return {
			drop: moveStr[0],
			to: { row: toRank.charCodeAt(0) - 97, col: 5 - toFile },
		};
	}
	const fromFile = parseInt(moveStr[0]);
	const fromRank = moveStr[1];
	const toFile = parseInt(moveStr[2]);
	const toRank = moveStr[3];
	return {
		from: { row: fromRank.charCodeAt(0) - 97, col: 5 - fromFile },
		to: { row: toRank.charCodeAt(0) - 97, col: 5 - toFile },
		promote: moveStr.length >= 5 && moveStr[4] === "+",
	};
}

// ========= API =========

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { sfen, depth = 4 } = body;

		if (!sfen || typeof sfen !== "string") {
			return NextResponse.json({ error: "sfenパラメータが必要です" }, { status: 400 });
		}

		// C++エンジンを使用
		const enginePath = findEnginePath();
		if (!enginePath) {
			console.error("[Engine] C++バイナリが見つかりません");
			return NextResponse.json({ error: "エンジンが見つかりません" }, { status: 500 });
		}

		try {
			const { stdout, stderr } = await execFileAsync(enginePath, [sfen, String(depth)], { timeout: 10000 });
			if (stderr) console.error("[Engine stderr]", stderr);

			const output = stdout.trim();
			const match = output.match(/^bestmove\s+(.+)$/);
			if (match) {
				const bestmove = match[1];
				if (bestmove === "resign") {
					return NextResponse.json({ bestmove: null, resign: true, engine: "cpp" });
				}
				return NextResponse.json({ bestmove, parsed: parseMoveString(bestmove), resign: false, engine: "cpp" });
			} else {
				return NextResponse.json({ error: "エンジンの出力が不正です", raw: output }, { status: 500 });
			}
		} catch (cppError: unknown) {
			console.error("[Engine] C++実行失敗:", cppError);
			const message = cppError instanceof Error ? cppError.message : "Engine execution failed";
			return NextResponse.json({ error: "エンジンの実行に失敗しました", detail: message }, { status: 500 });
		}
	} catch (error: unknown) {
		console.error("[API error]", error);
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json({ error: "API実行エラー", detail: message }, { status: 500 });
	}
}
