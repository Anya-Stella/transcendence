"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import MatchBoard from "@/components/MatchBoard";

export default function OnlineMatchPage() {
	const params = useParams();
	const roomId = params.roomId as string;
	const [socket, setSocket] = useState<Socket | null>(null);
	const [wsStatus, setWsStatus] = useState<"connected" | "disconnected" | "connecting">("connecting");
	const [mySide, setMySide] = useState<"sente" | "gote" | null>(null);

	useEffect(() => {
		const s = io("http://localhost:3001", {
			transports: ["websocket"],
		});

		// Handshake and side logic
		const checkSide = (players: { socketId: string }[]) => {
			if (!s.id) return false;
			const idx = players.findIndex(p => p.socketId === s.id);
			if (idx === 0) {
				setMySide("sente");
				return true;
			} else if (idx === 1) {
				setMySide("gote");
				return true;
			}
			return false;
		};

		s.on("roomState", (state: { players: { socketId: string }[] }) => {
			console.log("[WS] Room state update:", state);
			checkSide(state.players);
		});

		s.on("setSide", (data: { side: "sente" | "gote" }) => {
			console.log("[WS] Server setSide:", data.side);
			setMySide(data.side);
		});

		s.on("connect", () => {
			console.log("[WS] Connected. ID:", s.id);
			setWsStatus("connected");
			s.emit("joinRoom", { roomId });
		});

		s.on("disconnect", () => {
			setWsStatus("disconnected");
		});

		setSocket(s);

		return () => {
			s.disconnect();
		};
	}, [roomId]);

	return (
		<MatchBoard
			roomId={roomId}
			socket={socket}
			wsStatus={wsStatus}
			mySide={mySide || "sente"}
			isPreparing={!mySide}
		/>
	);
}
