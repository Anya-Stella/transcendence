"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";
import MatchBoard from "@/components/MatchBoard";
import { useUser } from "@/hooks/useUser";
import { PlayerSide } from "@/types/game";

export default function OnlineMatchPage() {
	const params = useParams();
	const roomId = params.roomId as string;
	const [socket, setSocket] = useState<Socket | null>(null);
	const [wsStatus, setWsStatus] = useState<"connected" | "disconnected" | "connecting">("connecting");
	const [mySide, setMySide] = useState<PlayerSide>("spectator");
	const [initialMessages, setInitialMessages] = useState<any[]>([]);
	const userId = useUser();

	useEffect(() => {
		const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
		const wsUrl = `https://${host}:8080`;

		const s = io(wsUrl);

		s.on("connect", () => {
			// console.log("[WS] Connected. ID:", s.id);
			setWsStatus("connected");
			s.emit("joinRoom", {
				roomId: roomId,
				isPlayer: true,
				userId: userId
			});
		});

		s.on("disconnect", () => {
			setWsStatus("disconnected");
		});

		s.on("roomState", (state: { players: { socketId: string, userId?: string, side: "b" | "w" }[], messages?: any[] }) => {
			// console.log("[WS] Room state update:", state);
			const me = state.players.find((p) =>
				(userId && p.userId === userId) || p.socketId === s.id
			);
			if (me) {
				setMySide(me.side === "b" ? "sente" : "gote");
			} else {
				setMySide("spectator");
			}
			if (state.messages) {
				setInitialMessages(state.messages);
			}
		});

		setSocket(s);

		return () => {
			s.disconnect();
		};
	}, [roomId, userId]);

	return (
		<MatchBoard
			roomId={roomId}
			socket={socket}
			wsStatus={wsStatus}
			mySide={mySide}
			isPreparing={wsStatus === "connecting"}
			initialMessages={initialMessages}
		/>
	);
}
