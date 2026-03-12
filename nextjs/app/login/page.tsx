"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
	const router = useRouter();
	const [mode, setMode] = useState<"login" | "signup">("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const endpoint =
				mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
			const body =
				mode === "signup"
					? { email, password, name }
					: { email, password };

			const res = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const data = await res.json();

			if (!res.ok) {
				setError(data.error || "エラーが発生しました");
				return;
			}

			router.push("/home");
			router.refresh();
		} catch {
			setError("ネットワークエラーが発生しました");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="page">
			<h1 className="logo">将棋ゲーム</h1>

			<div className="card">
				<div className="tabs">
					<button
						className={`tab ${mode === "login" ? "tab-active" : ""}`}
						onClick={() => { setMode("login"); setError(""); }}
					>
						ログイン
					</button>
					<button
						className={`tab ${mode === "signup" ? "tab-active" : ""}`}
						onClick={() => { setMode("signup"); setError(""); }}
					>
						新規登録
					</button>
				</div>

				{error && <div className="error-box">{error}</div>}

				<form onSubmit={handleSubmit}>
					{mode === "signup" && (
						<div className="form-group">
							<label className="form-label" htmlFor="name">
								名前
							</label>
							<input
								id="name"
								className="form-input"
								type="text"
								placeholder="表示名を入力"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
						</div>
					)}

					<div className="form-group">
						<label className="form-label" htmlFor="email">
							メールアドレス
						</label>
						<input
							id="email"
							className="form-input"
							type="email"
							placeholder="example@email.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>

					<div className="form-group">
						<label className="form-label" htmlFor="password">
							パスワード
						</label>
						<input
							id="password"
							className="form-input"
							type="password"
							placeholder={mode === "signup" ? "8文字以上" : "パスワード"}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={mode === "signup" ? 8 : undefined}
						/>
					</div>

					<button
						type="submit"
						className="btn btn-primary btn-block btn-lg mt-16"
						disabled={loading}
					>
						{loading
							? "処理中..."
							: mode === "login"
								? "ログイン"
								: "アカウントを作成"}
					</button>
				</form>
			</div>
		</div>
	);
}
