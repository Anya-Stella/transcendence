"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
<<<<<<< HEAD
import { Suspense } from "react"; // 1. Suspenseをインポート

// 2. 実際にロジックを持つ中身を別の関数にする
function ResultContent() {
    const searchParams = useSearchParams();
    const roomId = searchParams.get("roomId");

    // Dummy result data
    const isWin = true;
    const reason = "王を取りました";

    return (
        <div className="page">
            <div className="card card-wide">
                <div className="result-container">
                    <div
                        style={{
                            fontSize: "4rem",
                            marginBottom: "8px",
                        }}
                    >
                        {isWin ? "🎉" : "😢"}
                    </div>
                    <h2 className={`result-title ${isWin ? "result-win" : "result-lose"}`}>
                        {isWin ? "勝利！" : "敗北"}
                    </h2>
                    <p className="result-reason">{reason}</p>

                    <div className="result-buttons">
                        {roomId && (
                            <Link
                                href={`/room/${roomId}?host=true`}
                                className="btn btn-primary btn-block btn-lg"
                                style={{ textAlign: "center" }}
                            >
                                🔄 もう一回（同じ相手）
                            </Link>
                        )}
                        <Link
                            href="/home"
                            className="btn btn-outline btn-block btn-lg"
                            style={{ textAlign: "center" }}
                        >
                            🏠 ホームへ
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

// 3. 元の ResultPage は Suspense で包むだけのラッパーにする
export default function ResultPage() {
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
            </header>

            {/* useSearchParamsを使う部分はここに入れる */}
            <Suspense fallback={<div>読み込み中...</div>}>
                <ResultContent />
            </Suspense>
        </div>
    );
}
=======

export default function ResultPage() {
	const searchParams = useSearchParams();
	const roomId = searchParams.get("roomId");

	// Dummy result data
	const isWin = true;
	const reason = "王を取りました";

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
			</header>

			<div className="page">
				<div className="card card-wide">
					<div className="result-container">
						<div
							style={{
								fontSize: "4rem",
								marginBottom: "8px",
							}}
						>
							{isWin ? "🎉" : "😢"}
						</div>
						<h2 className={`result-title ${isWin ? "result-win" : "result-lose"}`}>
							{isWin ? "勝利！" : "敗北"}
						</h2>
						<p className="result-reason">{reason}</p>

						<div className="result-buttons">
							{roomId && (
								<Link
									href={`/room/${roomId}?host=true`}
									className="btn btn-primary btn-block btn-lg"
									style={{ textAlign: "center" }}
								>
									🔄 もう一回（同じ相手）
								</Link>
							)}
							<Link
								href="/home"
								className="btn btn-outline btn-block btn-lg"
								style={{ textAlign: "center" }}
							>
								🏠 ホームへ
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
>>>>>>> origin/dev
