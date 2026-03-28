"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import MatchBoard from "@/components/MatchBoard";
import { useUser } from "@/hooks/useUser";

export default function OnlineMatchPage() {
	const params = useParams();
	const roomId = params.roomId as string;
	const [socket, setSocket] = useState<Socket | null>(null);
	const [wsStatus, setWsStatus] = useState<"connected" | "disconnected" | "connecting">("connecting");
	const [mySide, setMySide] = useState<"sente" | "gote" | "spectator">("spectator");
	const userId = useUser();

	useEffect(() => {
		const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
		const wsUrl = `http://${host}:3001`;

		const s = io(wsUrl, {
			transports: ["websocket"],
		});

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

		s.on("roomState", (state: { players: { socketId: string, userId?: string, side: "b" | "w" }[] }) => {
			// console.log("[WS] Room state update:", state);
			const me = state.players.find((p) =>
				(userId && p.userId === userId) || p.socketId === s.id
			);
			if (me) {
				setMySide(me.side === "b" ? "sente" : "gote");
			} else {
				setMySide("spectator");
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
		/>
	);
}
