/* Conexión Socket.IO (Push en tiempo real) */
import { getApiBase } from "./config.js";

let socket = null;

export function connectSocket() {
  const API_BASE = getApiBase();

  // Reutiliza la conexión si ya existe y está activa
  if (socket && socket.connected) {
    console.log("ℹ️ Reutilizando socket existente:", socket.id);
    return socket;
  }

  console.log("🔌 Conectando WS a:", API_BASE);

  // Configuración solo WebSocket (sin polling)
  socket = io(API_BASE, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000
  });

  socket.on("connect", () => console.log("✅ Socket conectado:", socket.id));
  socket.on("disconnect", (reason) => console.warn("⚠️ Socket desconectado:", reason));
  socket.on("connect_error", (err) => console.error("❌ Error WS:", err.message));

  return socket;
}

console.log("✅ sockets.js cargado");