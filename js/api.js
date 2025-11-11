/* =====================================================
   API IOT CARBOT — Cliente REST (fetch async/await)
   Usa API_BASE dinámico → definido en config.js
===================================================== */

import { apiUrl } from "./config.js";

// Utilidad: convertir response
async function handleResponse(res) {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

// GET helper
async function GET(path) {
  const url = apiUrl(path);
  const res = await fetch(url);
  return handleResponse(res);
}

// POST helper (JSON)
async function POST(path, body) {
  const url = apiUrl(path);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return handleResponse(res);
}

/* =====================================================
 ✅ MOVEMENT
===================================================== */
export const movement = {
  add: (payload) =>
    POST("/api/movement/add", payload),

  last: (deviceId) =>
    GET(`/api/movement/last/${deviceId}`),

  last10: (deviceId) =>
    GET(`/api/movement/last10/${deviceId}`)
};

/* =====================================================
 ✅ OBSTACLE
===================================================== */
export const obstacle = {
  add: (payload) =>
    POST("/api/obstacle/add", payload),

  last: (deviceId) =>
    GET(`/api/obstacle/last/${deviceId}`),

  last10: (deviceId) =>
    GET(`/api/obstacle/last10/${deviceId}`)
};

/* =====================================================
 ✅ DEMO
===================================================== */
export const demo = {
  create: (payload) =>
    POST("/api/demo/create", payload),

  last20: () =>
    GET("/api/demo/last20"),

  run: (payload) =>
    POST("/api/demo/run", payload)
};

/* =====================================================
 ✅ DEBUG (opcional)
===================================================== */
export const debug = {
  dbinfo: () =>
    GET("/api/dev/dbinfo"),

  probeMovement: () =>
    POST("/api/dev/probe-move", {})
};

console.log("✅ api.js cargado →", apiUrl(""));
