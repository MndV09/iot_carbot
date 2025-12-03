/* Cliente API REST */
import { apiUrl } from "./config.js";

// Wrapper para manejar errores HTTP y parsear JSON
async function handleResponse(res) {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

async function GET(path) {
  const url = apiUrl(path);
  const res = await fetch(url);
  return handleResponse(res);
}

async function POST(path, body) {
  const url = apiUrl(path);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return handleResponse(res);
}

// --- Endpoints de Movimiento ---
export const movement = {
  add: (payload) => POST("/api/movement/add", payload),
  last: (deviceId) => GET(`/api/movement/last/${deviceId}`),
  last10: (deviceId) => GET(`/api/movement/last10/${deviceId}`)
};

// --- Endpoints de Obstáculos ---
export const obstacle = {
  add: (payload) => POST("/api/obstacle/add", payload),
  last: (deviceId) => GET(`/api/obstacle/last/${deviceId}`),
  last10: (deviceId) => GET(`/api/obstacle/last10/${deviceId}`)
};

// --- Endpoints de Demos (Secuencias) ---
export const demo = {
  create: (payload) => POST("/api/demo/create", payload),
  last20: () => GET("/api/demo/last20"),
  run: (payload) => POST("/api/demo/run", payload)
};

// --- Endpoints de Desarrollo ---
export const debug = {
  dbinfo: () => GET("/api/dev/dbinfo"),
  probeMovement: () => POST("/api/dev/probe-move", {})
};

console.log("✅ api.js cargado →", apiUrl(""));