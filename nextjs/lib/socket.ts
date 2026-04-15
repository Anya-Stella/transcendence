"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    socket = io(`https://${host}:8080`);
  }
  return socket;
};
