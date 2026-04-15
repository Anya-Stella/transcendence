"use client";

import MatchBoard from "@/components/MatchBoard";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";
import { PlayerSide } from "@/types/game";

export default function SpectateRoomPage() {
    const params = useParams();
    const roomId = params.roomId as string;

    const [socket, setSocket] = useState<Socket | null>(null);
    const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
    const [mySide, setMySide] = useState<PlayerSide>("spectator");
    const [initialMessages, setInitialMessages] = useState<any[]>([]);


    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    useEffect(() => {
        const s = io(`https://${host}:8080`);

        const onConnect = () => {
            setWsStatus("connected");
            s.emit("joinRoom", {roomId: roomId,isPlayer:false});
        };

        if (s.connected) {
            onConnect();
        } else {
            s.on("connect", onConnect);
        }

        const onRoomState = (state: { messages?: any[] }) => {
            if (state.messages) {
                setInitialMessages(state.messages);
            }
        };
        s.on("roomState", onRoomState);

        const onDisconnect = () => setWsStatus("disconnected");
        s.on("disconnect", onDisconnect);

        setSocket(s);
        return () => {
            s.disconnect();
            s.off("connect", onConnect);
            s.off("roomState", onRoomState);
            s.off("disconnect", onDisconnect);
        };
    }, [roomId]);

    return (
		<MatchBoard
			roomId={roomId}
			socket={socket}
			wsStatus={wsStatus}
			mySide={mySide}
			initialMessages={initialMessages}
		/>
	);
}