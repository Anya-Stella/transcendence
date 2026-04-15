"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import Chat from "@/components/Chat/Chat";


interface Player {
	socketId: string;
	userId?: string;
	side?: "b" | "w";
}

interface RoomState {
	roomId: string;
	hostSocketId: string;
	hostUserId?: string;
	players: Player[];
	sfen?: string;
	messages?: any[];
}

export default function RoomPage() {
	const params = useParams();
	const searchParams = useSearchParams();
	const router = useRouter();
	const { data: session } = useSession();
	const roomId = params.roomId as string;
	const isHost = searchParams.get("host") === "true";
	const [copied, setCopied] = useState(false);
	const [socket, setSocket] = useState<Socket | null>(null);
	const [roomState, setRoomState] = useState<RoomState | null>(null);
	const [mySocketId, setMySocketId] = useState<string | null>(null);
	const userId = (session?.user as { id?: string } | undefined)?.id ?? null;


	const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
	const wsUrl = `https://${host}:8080`;
	// WebSocket接続
	useEffect(() => {
		const s = io(wsUrl);

		s.on("connect", () => {
			setMySocketId(s.id ?? null);
			s.emit("joinRoom", { roomId, userId, isPlayer: true });
		});

		s.on("roomState", (state: RoomState) => {
			setRoomState(state);
		});

		s.on("gameStart", (data: { roomId: string }) => {
			router.push(`/match/${data.roomId}`);
		});

		s.on("playerLeft", () => { });

		setSocket(s);

		return () => {
			s.disconnect();
		};
	}, [roomId, userId]);

	const playerCount = roomState?.players?.length ?? (isHost ? 1 : 0);
	const amIHost = mySocketId ? roomState?.hostSocketId === mySocketId : isHost;

	// Chat 側の表示用（ルーム待機画面では仮の Sente/Gote 判定を行う）
	const me = roomState?.players.find(p => (userId && p.userId === userId) || p.socketId === mySocketId);
	const mySideInRoom = me ? (me.side === "b" ? "sente" : "gote") : "spectator";

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
		<div className="wafuu-page">
			{/* 背景（onlineと同じ広間） */}
			<div
				className="wafuu-bg"
				style={{ backgroundImage: "url(/images/online-bg.png)" }}
			/>

			<Header
				title="将棋ゲーム"
				rightElement={
					<span className="wafuu-badge wafuu-badge-info">
						{amIHost ? "👑 ホスト" : "参加者"}
					</span>
				}
			/>

			{/* コンテンツ */}
			<div className="wafuu-content">
				<div className="wafuu-card">
					{/* ルームID */}
					<div style={{ textAlign: "center", marginBottom: "20px" }}>
						<div
							style={{
								fontSize: "2rem",
								fontWeight: 800,
								letterSpacing: "0.2em",
								color: "#d4af37",
								textShadow: "0 0 12px rgba(212, 175, 55, 0.3)",
								margin: "8px 0",
							}}
						>
							{roomId}
						</div>
						<button
							onClick={handleCopy}
							style={{
								padding: "6px 16px",
								background: "rgba(212, 175, 55, 0.1)",
								border: "1px solid rgba(212, 175, 55, 0.3)",
								borderRadius: "8px",
								color: "#f5e6c8",
								fontSize: "0.8rem",
								cursor: "pointer",
								transition: "all 0.3s ease",
							}}
						>
							📋 {copied ? "コピーしました！" : "ルームIDをコピー"}
						</button>
					</div>

					{/* プレイヤー表示 */}
					<div
						style={{
							display: "flex",
							gap: "12px",
							justifyContent: "center",
							margin: "20px 0",
						}}
					>
						{roomState?.players.map((p, i) => (
							<div
								key={p.socketId}
								style={{
									width: "52px",
									height: "52px",
									borderRadius: "50%",
									background:
										i === 0
											? "linear-gradient(135deg, #b8860b, #d4af37)"
											: "linear-gradient(135deg, #4a6741, #6b8f63)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									color: "#1a1208",
									fontWeight: 700,
									fontSize: "1.1rem",
									border:
										p.socketId === mySocketId
											? "3px solid #4ade80"
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
									width: "52px",
									height: "52px",
									borderRadius: "50%",
									background: "rgba(245, 230, 200, 0.1)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									color: "rgba(245, 230, 200, 0.3)",
									fontWeight: 700,
									fontSize: "1.1rem",
									border: "2px dashed rgba(245, 230, 200, 0.15)",
								}}
							>
								?
							</div>
						))}
					</div>

					{/* ステータス */}
					<div
						style={{
							textAlign: "center",
							color: playerCount < 2
								? "rgba(245, 230, 200, 0.5)"
								: "#4ade80",
							fontSize: "0.9rem",
							marginBottom: "20px",
						}}
						className={playerCount < 2 ? "wafuu-pulse" : ""}
					>
						{playerCount < 2
							? "相手の参加を待っています..."
							: "✅ 2人揃いました！"}
					</div>

					{/* アクションボタン */}
					<div className="wafuu-flex-col wafuu-gap-12">
						{amIHost && (
							<button
								className="wafuu-btn-primary"
								onClick={handleStart}
								disabled={playerCount < 2}
							>
								対局を始める
							</button>
						)}
						{!amIHost && (
							<p
								className="wafuu-pulse"
								style={{
									textAlign: "center",
									color: "rgba(245, 230, 200, 0.5)",
									fontSize: "0.85rem",
								}}
							>
								ホストが対局を開始するのを待っています...
							</p>
						)}
						<Link href="/home" className="wafuu-btn-outline">
							← 戻る
						</Link>
					</div>
				</div>
			</div>

			{/* チャット画面 */}
			{socket && roomId && (
				<Chat
					socket={socket}
					roomId={roomId}
					mySide={mySideInRoom}
					initialMessages={roomState?.messages}
				/>
			)}
		</div>
	);
}
