import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";
import { DEFAULT_API_BASE } from "./config.js";

// Conectar por WS (no WSS), forzando transporte websocket para evitar polling/upgrade
export function connectSocket() {
  return io(DEFAULT_API_BASE, {
    transports: ["websocket"],
    upgrade: false,
    path: "/socket.io/",
    withCredentials: false,
  });
}
