import { Server, Socket } from "socket.io";
import http from "http";

const PORT = 3001;

interface RoomState {
	hostSocketId: string;
	hostUserId?: string;
	players: { socketId: string; userId?: string }[];
}

const rooms = new Map<string, RoomState>();

const httpServer = http.createServer((_req, res) => {
	res.writeHead(200, { "Content-Type": "application/json" });
	res.end(JSON.stringify({ status: "ok", service: "torassen-ws-server" }));
});

const io = new Server(httpServer, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

io.on("connection", (socket: Socket) => {
	console.log(`[WS] Client connected: ${socket.id}`);

	// --- joinRoom ---
	socket.on("joinRoom", (data: { roomId: string; userId?: string }) => {
		const { roomId, userId } = data;
		console.log(`[WS] joinRoom: ${roomId} by ${socket.id} (user: ${userId})`);

		let room = rooms.get(roomId);

		if (!room) {
			// First player becomes host
			room = {
				hostSocketId: socket.id,
				hostUserId: userId,
				players: [{ socketId: socket.id, userId }],
			};
			rooms.set(roomId, room);
		} else {
			// Add player if not already in room and room not full
			const alreadyIn = room.players.find((p) => p.socketId === socket.id);
			if (!alreadyIn && room.players.length < 2) {
				room.players.push({ socketId: socket.id, userId });
			}
		}

		socket.join(roomId);

		// Broadcast room state to all players in the room
		io.to(roomId).emit("roomState", {
			roomId,
			hostSocketId: room.hostSocketId,
			hostUserId: room.hostUserId,
			playerCount: room.players.length,
			players: room.players.map((p) => ({
				socketId: p.socketId,
				userId: p.userId,
			})),
		});
	});

	// --- roomState (query) ---
	socket.on("getRoomState", (data: { roomId: string }) => {
		const room = rooms.get(data.roomId);
		if (room) {
			socket.emit("roomState", {
				roomId: data.roomId,
				hostSocketId: room.hostSocketId,
				hostUserId: room.hostUserId,
				playerCount: room.players.length,
				players: room.players.map((p) => ({
					socketId: p.socketId,
					userId: p.userId,
				})),
			});
		} else {
			socket.emit("roomState", {
				roomId: data.roomId,
				hostSocketId: null,
				playerCount: 0,
				players: [],
			});
		}
	});

	// --- hostStart ---
	socket.on("hostStart", (data: { roomId: string }) => {
		const room = rooms.get(data.roomId);
		if (!room) {
			socket.emit("error", { message: "ルームが見つかりません" });
			return;
		}

		if (room.hostSocketId !== socket.id) {
			socket.emit("error", { message: "ホストのみ開始できます" });
			return;
		}

		if (room.players.length < 2) {
			socket.emit("error", { message: "2人揃わないと開始できません" });
			return;
		}

		console.log(`[WS] Game started in room: ${data.roomId}`);
		io.to(data.roomId).emit("gameStart", {
			roomId: data.roomId,
			players: room.players,
		});
	});

	// --- move ---
	socket.on(
		"move",
		(data: {
			roomId: string;
			from?: { row: number; col: number };
			to: { row: number; col: number };
			promote?: boolean;
			drop?: string;
		}) => {
			const room = rooms.get(data.roomId);
			if (!room) return;

			const isPlayer = room.players.some((p) => p.socketId === socket.id);
			if (!isPlayer) return;

			if (data.drop) {
				console.log(
					`[WS] Drop in room ${data.roomId}: ${data.drop} → (${data.to.row},${data.to.col})`
				);
			} else if (data.from) {
				console.log(
					`[WS] Move in room ${data.roomId}: (${data.from.row},${data.from.col}) → (${data.to.row},${data.to.col})${data.promote ? "+" : ""}`
				);
			}

			// Broadcast to other players in the room (not to sender)
			socket.to(data.roomId).emit("moveMade", {
				from: data.from,
				to: data.to,
				promote: data.promote,
				drop: data.drop,
			});
		}
	);

	// --- disconnect ---
	socket.on("disconnect", () => {
		console.log(`[WS] Client disconnected: ${socket.id}`);

		// Clean up rooms
		for (const [roomId, room] of rooms.entries()) {
			const idx = room.players.findIndex((p) => p.socketId === socket.id);
			if (idx !== -1) {
				room.players.splice(idx, 1);

				if (room.players.length === 0) {
					rooms.delete(roomId);
					console.log(`[WS] Room deleted: ${roomId}`);
				} else {
					// If host left, transfer host
					if (room.hostSocketId === socket.id && room.players.length > 0) {
						room.hostSocketId = room.players[0].socketId;
						room.hostUserId = room.players[0].userId;
					}

					io.to(roomId).emit("roomState", {
						roomId,
						hostSocketId: room.hostSocketId,
						hostUserId: room.hostUserId,
						playerCount: room.players.length,
						players: room.players.map((p) => ({
							socketId: p.socketId,
							userId: p.userId,
						})),
					});

					io.to(roomId).emit("playerLeft", { socketId: socket.id });
				}
			}
		}
	});
});

httpServer.listen(PORT, () => {
	console.log(`[WS] WebSocket server running on port ${PORT}`);
});
