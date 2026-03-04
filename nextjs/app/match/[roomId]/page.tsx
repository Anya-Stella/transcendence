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
	const [mySide, setMySide] = useState<"sente" | "gote">("sente");

	useEffect(() => {
		const s = io("http://localhost:3001", {
			transports: ["websocket"],
		});

		s.on("connect", () => {
			setWsStatus("connected");
			// Join room for move sync
			s.emit("joinRoom", { roomId });
		});

		s.on("disconnect", () => {
			setWsStatus("disconnected");
		});

		// Determine side based on room state
		s.on("roomState", (state: { players: { socketId: string }[] }) => {
			const myIndex = state.players.findIndex((p) => p.socketId === s.id);
			if (myIndex === 0) {
				setMySide("sente");
			} else if (myIndex === 1) {
				setMySide("gote");
			}
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
			mySide={mySide}
		/>
	);
}
