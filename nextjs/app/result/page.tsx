"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

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
