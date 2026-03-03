"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SpectatePage() {
	const router = useRouter();
	const [roomId, setRoomId] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = roomId.trim().toUpperCase();
		if (!trimmed) {
			setError("ルームIDを入力してください");
			return;
		}
		router.push(`/spectate/${trimmed}`);
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
			</header>

			<div className="page page-top">
				<div className="card">
					<h3 className="card-title">👁️ 観戦する</h3>

					{error && <div className="error-box">{error}</div>}

					<form onSubmit={handleSubmit}>
						<div className="form-group">
							<label className="form-label" htmlFor="spectateRoomId">
								観戦するルームのID
							</label>
							<input
								id="spectateRoomId"
								className="form-input"
								type="text"
								placeholder="例: ABC123"
								value={roomId}
								onChange={(e) => {
									setRoomId(e.target.value.toUpperCase());
									setError("");
								}}
								maxLength={10}
								style={{
									textAlign: "center",
									fontSize: "1.3rem",
									letterSpacing: "0.1em",
								}}
								autoFocus
							/>
						</div>

						<button
							type="submit"
							className="btn btn-primary btn-block btn-lg mt-16"
						>
							観戦を開始
						</button>
						<Link
							href="/home"
							className="btn btn-outline btn-block mt-16"
							style={{ textAlign: "center" }}
						>
							← ホームに戻る
						</Link>
					</form>
				</div>
			</div>
		</div>
	);
}
