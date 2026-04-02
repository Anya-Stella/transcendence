"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";

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
		<div className="wafuu-page">
			{/* 背景 */}
			<div
				className="wafuu-bg"
				style={{ backgroundImage: "url(/images/online-bg.png)" }}
			/>

			<Header title="将棋ゲーム" logoHref="/home" />

			{/* コンテンツ */}
			<div className="wafuu-content">
				<div className="wafuu-card">
					<h3
						className="wafuu-heading"
						style={{ fontSize: "1.2rem", marginBottom: "16px" }}
					>
						観戦する
					</h3>

					{error && <div className="wafuu-error">{error}</div>}

					<form
						className="wafuu-flex-col wafuu-gap-16"
						onSubmit={handleSubmit}
					>
						<div>
							<label className="wafuu-label" htmlFor="spectateRoomId">
								観戦するルームのID
							</label>
							<input
								id="spectateRoomId"
								className="wafuu-input"
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
									letterSpacing: "0.15em",
								}}
								autoFocus
							/>
						</div>

						<button type="submit" className="wafuu-btn-primary">
							観戦を開始
						</button>
						<Link href="/home" className="wafuu-btn-outline">
							← 戻る
						</Link>
					</form>
				</div>
			</div>
		</div>
	);
}
