"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";

interface Player {
	socketId: string;
	userId?: string;
}

interface RoomState {
	roomId: string;
	hostSocketId: string;
	hostUserId?: string;
	playerCount: number;
	players: Player[];
}

export default function RoomPage() {
	const params = useParams();
	const searchParams = useSearchParams();
	const router = useRouter();
	const roomId = params.roomId as string;
	const isHost = searchParams.get("host") === "true";
	const [copied, setCopied] = useState(false);
	const [socket, setSocket] = useState<Socket | null>(null);
	const [roomState, setRoomState] = useState<RoomState | null>(null);
	const [mySocketId, setMySocketId] = useState<string | null>(null);
	const [userId, setUserId] = useState<string | null>(null);

	// Fetch current user
	useEffect(() => {
		fetch("/api/me")
			.then((res) => res.json())
			.then((data) => {
				if (data.user) setUserId(data.user.id);
			})
			.catch(() => { });
	}, []);

	// Connect to WebSocket
	useEffect(() => {
		const s = io("http://localhost:3001", {
			transports: ["websocket"],
		});

		s.on("connect", () => {
			setMySocketId(s.id ?? null);
			// Join room once connected
			s.emit("joinRoom", { roomId, userId });
		});

		s.on("roomState", (state: RoomState) => {
			setRoomState(state);
		});

		s.on("gameStart", (data: { roomId: string }) => {
			router.push(`/match/${data.roomId}`);
		});

		s.on("playerLeft", () => {
			// Room state will be updated by the roomState event
		});

		setSocket(s);

		return () => {
			s.disconnect();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomId, userId]);

	const playerCount = roomState?.playerCount ?? (isHost ? 1 : 0);
	const amIHost = mySocketId ? roomState?.hostSocketId === mySocketId : isHost;

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(roomId);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			const input = document.createElement("input");
			input.value = roomId;
			document.body.appendChild(input);
			input.select();
			document.execCommand("copy");
			document.body.removeChild(input);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleStart = useCallback(() => {
		if (socket) {
			socket.emit("hostStart", { roomId });
		}
	}, [socket, roomId]);

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
				<span className="text-muted text-sm">
					{amIHost ? "👑 ホスト" : "参加者"}
				</span>
			</header>

			<div className="page page-top">
				<div className="card card-wide">
					<h3 className="card-title">対局ルーム</h3>

					<div className="room-info">
						<div className="room-id">{roomId}</div>

						<button className="copy-btn" onClick={handleCopy}>
							📋 {copied ? "コピーしました！" : "ルームIDをコピー"}
						</button>

						<div className="room-status">
							<span className="room-status-dot" />
							{playerCount < 2
								? "相手の参加を待っています..."
								: "2人揃いました！"}
						</div>

						<div
							style={{
								display: "flex",
								gap: "8px",
								justifyContent: "center",
								marginBottom: "12px",
							}}
						>
							{roomState?.players.map((p, i) => (
								<div
									key={p.socketId}
									style={{
										width: "48px",
										height: "48px",
										borderRadius: "50%",
										background:
											i === 0
												? "var(--color-primary)"
												: "var(--color-secondary)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										color: "white",
										fontWeight: 700,
										fontSize: "1.1rem",
										border:
											p.socketId === mySocketId
												? "3px solid var(--color-success)"
												: "3px solid transparent",
									}}
								>
									P{i + 1}
								</div>
							))}
							{Array.from({
								length: Math.max(0, 2 - (roomState?.players.length ?? 0)),
							}).map((_, i) => (
								<div
									key={`empty-${i}`}
									style={{
										width: "48px",
										height: "48px",
										borderRadius: "50%",
										background: "var(--color-border)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										color: "var(--color-text-muted)",
										fontWeight: 700,
										fontSize: "1.1rem",
									}}
								>
									?
								</div>
							))}
						</div>
					</div>

					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "12px",
						}}
					>
						{amIHost && (
							<button
								className="btn btn-primary btn-block btn-lg"
								onClick={handleStart}
								disabled={playerCount < 2}
							>
								🎮 対局を始める
							</button>
						)}
						{!amIHost && playerCount < 2 && (
							<p className="text-center text-muted">
								ホストが対局を開始するのを待っています...
							</p>
						)}
						{!amIHost && playerCount >= 2 && (
							<p className="text-center text-muted">
								ホストが対局を開始するのを待っています...
							</p>
						)}
						<Link
							href="/home"
							className="btn btn-outline btn-block"
							style={{ textAlign: "center" }}
						>
							❌ キャンセルしてホームへ戻る
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
