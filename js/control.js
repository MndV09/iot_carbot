/* =====================================================
   CONTROL DE MOVIMIENTOS Y OBSTÁCULOS (Front-End)
   - Botones fijos de movimiento con diseño gamepad
   - Botón para registrar obstáculo aleatorio
   - Estado "en ejecución" y último obstáculo
   - Push en tiempo real con Socket.IO
===================================================== */

import { MOVES, OBSTACLES, getMoveById, randomObstacle } from "./catalogs.js";
import { movement, obstacle } from "./api.js";
import { connectSocket } from "./sockets.js";
import { getApiBase } from "./config.js";

// ----- Elementos del DOM -----
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const currentMoveEl  = $("#currentMove");
const lastObstacleEl = $("#lastObstacle");
const btnAddObstacle = $("#btnAddObstacle");

// ----- Config básica -----
const DEVICE_ID = Number(localStorage.getItem("DEVICE_ID") || "1");
const SOURCE    = "manual";

// ----- Helpers de UI -----
function setCurrentMoveText(moveId, eventAt) {
  const move = getMoveById(moveId);
  const label = move ? `${move.id} • ${move.name}` : `#${moveId}`;
  currentMoveEl.textContent = `(${eventAt || "..."}) ${label}`;
}

function setLastObstacleText(o) {
  if (!o) {
    lastObstacleEl.textContent = "Sin datos";
    return;
  }
  const id = Number(o.status_clave ?? o.obstacle_clave ?? o.id);
  const found = OBSTACLES.find(x => x.id === id);
  const name = found ? found.name : `#${id}`;
  const dist = o.distance_cm != null ? ` • ${o.distance_cm} cm` : "";
  const ts   = o.event_at || o.created_at || "...";
  lastObstacleEl.textContent = `(${ts}) ${id} • ${name}${dist}`;
}

// ----- Wire up botones fijos -----
function wireMovementButtons() {
  const buttons = $$('[data-move]');
  buttons.forEach(button => {
    button.addEventListener('click', async () => {
      const moveId = parseInt(button.getAttribute('data-move'));
      await sendMovement(moveId);
      
      // Efecto visual de feedback
      button.style.transform = 'translateY(-1px) scale(0.95)';
      setTimeout(() => {
        button.style.transform = '';
      }, 150);
    });
  });
}

// ----- Requests -----
async function sendMovement(statusClave) {
  try {
    const payload = {
      device_id: DEVICE_ID,
      status_clave: statusClave,
      source: SOURCE,
      sequence_id: null
    };
    const res = await movement.add(payload);
    // Actualiza inmediatamente el estado "en ejecución"
    const eventAt =
      res?.data?.event_at ||
      new Date().toISOString().slice(0, 19).replace("T", " ");
    setCurrentMoveText(statusClave, eventAt);
    console.log("POST /movement/add OK:", res);
  } catch (err) {
    console.error("POST /movement/add error:", err);
  }
}

async function sendRandomObstacle() {
  try {
    const rnd = randomObstacle();
    // números aleatorios simples para pruebas
    const distance = Number((10 + Math.random() * 40).toFixed(2)); // 10–50 cm
    const backMs   = 500 + Math.floor(Math.random() * 800);        // 500–1300 ms
    const payload = {
      device_id: DEVICE_ID,
      status_clave: rnd.id,
      distance_cm: distance,
      auto_react: 1,
      back_ms: backMs
    };
    const res = await obstacle.add(payload);
    console.log("POST /obstacle/add OK:", res);
    // Refresca "último obstáculo"
    await loadLastObstacle();
  } catch (err) {
    console.error("POST /obstacle/add error:", err);
  }
}

async function loadLastMove() {
  try {
    const res = await movement.last(DEVICE_ID);
    const r = res?.data;
    if (r) {
      const id = Number(r.status_clave ?? r.move_clave ?? r.id);
      setCurrentMoveText(id, r.event_at || r.created_at);
    } else {
      currentMoveEl.textContent = "Sin datos";
    }
  } catch (err) {
    console.warn("GET /movement/last error:", err);
    currentMoveEl.textContent = "Sin datos";
  }
}

async function loadLastObstacle() {
  try {
    const res = await obstacle.last(DEVICE_ID);
    const r = res?.data;
    setLastObstacleText(r);
  } catch (err) {
    console.warn("GET /obstacle/last error:", err);
    setLastObstacleText(null);
  }
}

// ----- Socket.IO (Push) -----
function initSocket() {
  const socket = connectSocket();

  socket.on("connect", () => {
    console.log("✅ WS conectado:", socket.id, "→", getApiBase());
  });

  socket.on("server_info", (d) => {
    console.log("ℹ️ server_info", d);
  });

  // Cuando el servidor emite un nuevo movimiento, actualizamos el estado
  socket.on("movement:new", (d) => {
    try {
      const id = Number(d?.status_clave ?? d?.move_clave ?? d?.id);
      const ts = d?.event_at || d?.created_at;
      setCurrentMoveText(id, ts);
    } catch (e) {
      console.log("movement:new parse warn:", e, d);
    }
  });

  // Cuando hay un nuevo obstáculo, lo mostramos
  socket.on("obstacle:new", (d) => {
    try {
      setLastObstacleText(d);
    } catch (e) {
      console.log("obstacle:new parse warn:", e, d);
    }
  });

  return socket;
}

// ----- Eventos UI -----
function wireUI() {
  btnAddObstacle.addEventListener("click", sendRandomObstacle);
  wireMovementButtons();
}

// ----- Init -----
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Control • API:", getApiBase(), "Device:", DEVICE_ID);
  wireUI();
  initSocket();

  // Cargar estados iniciales
  await Promise.all([loadLastMove(), loadLastObstacle()]);
});