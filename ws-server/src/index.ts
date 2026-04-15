import { Server, Socket } from "socket.io";
import http from "http";
import { apply } from "@torassen/shogi-logic"

const PORT = 3001;

interface RoomState {
	hostSocketId: string;
	hostUserId?: string;
	players: { socketId: string; userId?: string; side: "b" | "w"; connected: boolean }[];
	spectators: string[];
	sfen: string;
	status: "waiting" | "playing";
	messages: any[];
	emptyTimeout?: NodeJS.Timeout;
}

const INITIAL_SFEN = "rbsgk/4p/5/P4/KGSBR b - 1";

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

	socket.on("joinRoom", (data: { roomId: string; isPlayer: boolean, userId?: string }) => {
		const { roomId, isPlayer, userId } = data;
		console.log(`[WS] joinRoom: ${roomId} by ${socket.id} (user: ${userId})`);

		let room = rooms.get(roomId);

		if (!room) {
			room = {
				hostSocketId: socket.id,
				hostUserId: userId,
				players: [{ socketId: socket.id, userId, side: "b", connected: true }],
				spectators: [],
				sfen: INITIAL_SFEN,
				status: "waiting",
				messages: [],
			};
			rooms.set(roomId, room);
		} else if (isPlayer) {
			const existingPlayerIndex = room.players.findIndex(
				(p) => (p.userId && p.userId === userId) || p.socketId === socket.id
			);
			if (existingPlayerIndex !== -1) {
				room.players[existingPlayerIndex].socketId = socket.id;
				room.players[existingPlayerIndex].connected = true;
				if (room.emptyTimeout) {
					clearTimeout(room.emptyTimeout);
					delete room.emptyTimeout;
				}
			} else if (room.players.length < 2) {
				const occupiedSide = room.players[0] ? room.players[0].side : "w";
				const newSide = occupiedSide === "b" ? "w" : "b";
				room.players.push({ socketId: socket.id, userId, side: newSide, connected: true });
				if (room.players.length === 2) {
					room.status = "playing";
				}
			} else {
				if (!room.spectators.includes(socket.id))
					room.spectators.push(socket.id);
			}
		} else {
			console.log(`[WS] Spectator joined: ${socket.id}`);
			if (!room.spectators.includes(socket.id)) {
				room.spectators.push(socket.id);
			}
		}

		socket.join(roomId);

		io.to(roomId).emit("roomState", {
			roomId,
			sfen: room.sfen,
			hostSocketId: room.hostSocketId,
			hostUserId: room.hostUserId,
			players: room.players.map((p) => ({
				socketId: p.socketId,
				userId: p.userId,
				side: p.side,
			})),
			messages: room.messages,
		});
	});

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
					side: p.side,
				})),
				messages: room.messages,
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

	socket.on("getGameState", (data: { roomId: string }) => {
		const room = rooms.get(data.roomId);
		if (room) {
			socket.emit("syncState", { sfen: room.sfen });
		}
	});

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

			room.sfen = apply(room.sfen, data);

			socket.to(data.roomId).emit("moveMade", {
				from: data.from,
				to: data.to,
				promote: data.promote,
				drop: data.drop,
			});
		}
	);

	socket.on("chat", (data: { roomId: string; message: any }) => {
		console.log(`[WS] Chat in room ${data.roomId} from ${socket.id}`);
		const room = rooms.get(data.roomId);
		if (room) {
			room.messages.push(data.message);
		}
		socket.to(data.roomId).emit("chat", data.message);
	});

	socket.on("resign_match", (data: { roomId: string }) => {
		console.log(`[WS] resign_match received for room: ${data.roomId} from ${socket.id}`);
		const room = rooms.get(data.roomId);
		if (!room) {
			console.log(`[WS] Room ${data.roomId} not found for resignation`);
			return;
		}

		const loserIdx = room.players.findIndex((p) => p.socketId === socket.id);
		if (loserIdx === -1) return;

		const loserSide = room.players[loserIdx].side;
		const winnerSide = loserSide === "b" ? "gote" : "sente";

		const winnerName = winnerSide === "gote" ? "後手" : "先手";
		const loserName = loserSide === "w" ? "後手" : "先手";

		io.to(data.roomId).emit("match_ended", {
			winner: winnerSide,
			message: `${loserName}が投了しました。${winnerName}の勝ちです。`,
		});
	});

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
							side: p.side
						})),
						messages: room.messages,
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
