"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";

function generateRoomId(): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let result = "";
	for (let i = 0; i < 6; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

export default function OnlinePage() {
	const router = useRouter();
	const [mode, setMode] = useState<"select" | "join">("select");
	const [joinRoomId, setJoinRoomId] = useState("");
	const [error, setError] = useState("");

	const handleCreateRoom = () => {
		const roomId = generateRoomId();
		router.push(`/room/${roomId}?host=true`);
	};

	const handleJoinRoom = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = joinRoomId.trim().toUpperCase();
		if (!trimmed) {
			setError("ルームIDを入力してください");
			return;
		}
		if (trimmed.length < 4) {
			setError("正しいルームIDを入力してください");
			return;
		}
		router.push(`/room/${trimmed}`);
	};

	return (
		<div className="wafuu-page">
			{/* 背景 */}
			<div
				className="wafuu-bg"
				style={{ backgroundImage: "url(/images/online-bg.png)" }}
			/>

			<Header title="将棋ゲーム" logoHref="/home" />

			{/* コンテンツ */}
			<div className="wafuu-content">

				{mode === "select" ? (
					<div className="wafuu-card">
						<div className="wafuu-flex-col wafuu-gap-12">
							<button
								className="wafuu-btn-primary"
								onClick={handleCreateRoom}
							>
								部屋を立てる
							</button>
							<button
								className="wafuu-btn-secondary"
								onClick={() => setMode("join")}
							>
								部屋に入る
							</button>
							<Link href="/home" className="wafuu-btn-outline wafuu-mt-8">
								← 戻る
							</Link>
						</div>
					</div>
				) : (
					<div className="wafuu-card">
						<h3
							className="wafuu-heading"
							style={{ fontSize: "1.2rem", marginBottom: "16px" }}
						>
							部屋に入る
						</h3>

						{error && <div className="wafuu-error">{error}</div>}

						<form
							className="wafuu-flex-col wafuu-gap-16"
							onSubmit={handleJoinRoom}
						>
							<div>
								<label className="wafuu-label" htmlFor="roomId">
									ルームID
								</label>
								<input
									id="roomId"
									className="wafuu-input"
									type="text"
									placeholder="例: ABC123"
									value={joinRoomId}
									onChange={(e) => {
										setJoinRoomId(e.target.value.toUpperCase());
										setError("");
									}}
									maxLength={10}
									style={{
										textAlign: "center",
										fontSize: "1.3rem",
										letterSpacing: "0.15em",
									}}
									autoFocus
								/>
							</div>

							<button type="submit" className="wafuu-btn-primary">
								参加する
							</button>
							<button
								type="button"
								className="wafuu-btn-outline"
								onClick={() => {
									setMode("select");
									setError("");
								}}
							>
								← 戻る
							</button>
						</form>
					</div>
				)}
			</div>
		</div>
	);
}
