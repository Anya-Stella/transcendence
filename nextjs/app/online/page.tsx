"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
		<div>
			<header className="header">
				<Link href="/home" className="header-logo" style={{ textDecoration: "none" }}>
					🐯 虎戦
				</Link>
			</header>

			<div className="page page-top">
				<h2
					style={{
						fontSize: "1.5rem",
						fontWeight: 700,
						marginBottom: "24px",
						textAlign: "center",
					}}
				>
					オンライン対戦
				</h2>

				{mode === "select" ? (
					<div className="card">
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "12px",
							}}
						>
							<button
								className="btn btn-primary btn-block btn-lg"
								onClick={handleCreateRoom}
							>
								✨ ルームを作成する
							</button>
							<button
								className="btn btn-secondary btn-block btn-lg"
								onClick={() => setMode("join")}
							>
								🔑 ルームに参加する
							</button>
							<Link
								href="/home"
								className="btn btn-outline btn-block"
								style={{ textAlign: "center" }}
							>
								← ホームに戻る
							</Link>
						</div>
					</div>
				) : (
					<div className="card">
						<h3 className="card-title">ルームに参加</h3>

						{error && <div className="error-box">{error}</div>}

						<form onSubmit={handleJoinRoom}>
							<div className="form-group">
								<label className="form-label" htmlFor="roomId">
									ルームID
								</label>
								<input
									id="roomId"
									className="form-input"
									type="text"
									placeholder="例: ABC123"
									value={joinRoomId}
									onChange={(e) => {
										setJoinRoomId(e.target.value.toUpperCase());
										setError("");
									}}
									maxLength={10}
									style={{ textAlign: "center", fontSize: "1.3rem", letterSpacing: "0.1em" }}
									autoFocus
								/>
							</div>

							<button
								type="submit"
								className="btn btn-primary btn-block btn-lg mt-16"
							>
								参加する
							</button>
							<button
								type="button"
								className="btn btn-outline btn-block mt-16"
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
