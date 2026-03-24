"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import "./login.css";

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

		if (mode === "signup") {
			// 新規登録は独自のAPIを叩く（Auth.jsはデフォルトで登録画面を持っていないため）
			try {
				const res = await fetch("/api/auth/signup", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, password, name }),
				});
				const data = await res.json();
				if (!res.ok) {
					setError(data.error || "エラーが発生しました");
					setLoading(false);
					return;
				}
				// 登録成功後、そのままログインを試みる
			} catch {
				setError("ネットワークエラーが発生しました");
				setLoading(false);
				return;
			}
		}

		// Auth.js の CredentialsProvider を使ってログイン
		const result = await signIn("credentials", {
			email,
			password,
			redirect: false,
		});

		if (result?.error) {
			setError("ログインに失敗しました。メールアドレスまたはパスワードが正しくありません。");
			setLoading(false);
		} else {
			router.push("/home");
			router.refresh();
		}
	};

	const handleOAuthLogin = (provider: "github" | "google") => {
		signIn(provider, { callbackUrl: "/home" });
	};

	return (
		<div className="login-page">
			<div 
				className="login-bg" 
				style={{ backgroundImage: "url(/images/login-bg.png)" }}/>
			<div className="login-content">
				<h1 className="login-title">将棋ゲーム</h1>

				<div className="login-card">
					<div className="login-tabs">
						<button
							className={`login-tab ${mode === "login" ? "login-tab-active" : ""}`}
							onClick={() => { setMode("login"); setError(""); }}
						>
							ログイン
						</button>
						<button
							className={`login-tab ${mode === "signup" ? "login-tab-active" : ""}`}
							onClick={() => { setMode("signup"); setError(""); }}
						>
							新規登録
						</button>
					</div>

					{error && <div className="login-error">{error}</div>}

					<form className="login-form" onSubmit={handleSubmit}>
						{mode === "signup" && (
							<div className="login-field">
								<label className="login-label" htmlFor="name">
									名前
								</label>
								<input
									id="name"
									className="login-input"
									type="text"
									placeholder="表示名を入力"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required
								/>
							</div>
						)}

						<div className="login-field">
							<label className="login-label" htmlFor="email">
								メールアドレス
							</label>
							<input
								id="email"
								className="login-input"
								type="email"
								placeholder="example@email.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>

						<div className="login-field">
							<label className="login-label" htmlFor="password">
								パスワード
							</label>
							<input
								id="password"
								className="login-input"
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
							className="login-btn"
							disabled={loading}
						>
							{loading
								? "処理中..."
								: mode === "login"
									? "ログイン"
									: "新規登録"}
						</button>
					</form>

					<div className="oauth-separator">
						<span>または</span>
					</div>

					<div className="oauth-buttons">
						<button
							className="oauth-btn github-btn"
							onClick={() => handleOAuthLogin("github")}
						>
							GitHubでログイン
						</button>
						<button
							className="oauth-btn google-btn"
							onClick={() => handleOAuthLogin("google")}
						>
							Googleでログイン
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
