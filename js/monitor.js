/* =====================================================
   MONITOR EN VIVO — 100% WS (sin pulls en eventos)
===================================================== */
import { movement, obstacle } from "./api.js";
import { connectSocket } from "./sockets.js";
import { MOVES_MAP, OBSTACLES_MAP } from "./catalogs.js";
import { showToast, appendLog } from "./ui.js";

const $ = (s) => document.querySelector(s);
const DEVICE_ID = Number(new URLSearchParams(location.search).get("device_id") || 1);

// UI
const wsStatus     = $("#wsStatus");
const liveMove     = $("#liveMove");
const liveMoveTime = $("#liveMoveTime");
const liveObs      = $("#liveObs");
const liveObsTime  = $("#liveObsTime");
const tblMoveLog   = $("#tblMoveLog");
const tblObsLog    = $("#tblObsLog");

// Buffers locales (máx 10)
let mvLog = []; // movement events
let obLog = []; // obstacle events

/* ========== Helpers ========== */
function formatTS(ts) {
  if (!ts) return "...";
  return String(ts).replace("T", " ").slice(0, 19);
}
function labelMove(ev) {
  const id = Number(ev?.status_clave ?? ev?.move_clave ?? ev?.id);
  return MOVES_MAP[id]?.name ?? `#${id}`;
}
function labelObstacle(ev) {
  const id = Number(ev?.status_clave ?? ev?.obstacle_clave ?? ev?.id);
  return OBSTACLES_MAP[id]?.name ?? `#${id}`;
}
function renderTable(target, list, labelFn) {
  if (!target) return;
  target.innerHTML = "";
  list.forEach((row, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${labelFn(row)}</td>
      <td>${formatTS(row?.event_at)}</td>
    `;
    target.appendChild(tr);
  });
}
function pushEvent(buffer, ev, max = 10) {
  buffer.unshift(ev);
  if (buffer.length > max) buffer.length = max;
}

/* ========== Carga inicial (una sola vez) ========== */
async function loadInitialDataOnce() {
  try {
    // Estado inicial por REST (solo una vez)
    const [lastMv, mv10, lastOb, ob10] = await Promise.all([
      movement.last(DEVICE_ID), movement.last10(DEVICE_ID),
      obstacle.last(DEVICE_ID), obstacle.last10(DEVICE_ID)
    ]);

    const mv = lastMv?.data;
    if (mv) {
      liveMove.textContent = labelMove(mv);
      liveMoveTime.textContent = formatTS(mv?.event_at);
    }
    mvLog = (mv10?.data || []);
    renderTable(tblMoveLog, mvLog, labelMove);

    const ob = lastOb?.data;
    if (ob) {
      liveObs.textContent = labelObstacle(ob);
      liveObsTime.textContent = formatTS(ob?.event_at);
    }
    obLog = (ob10?.data || []);
    renderTable(tblObsLog, obLog, labelObstacle);

  } catch (err) {
    console.warn("❌ Error carga inicial:", err);
    showToast(`Error al obtener datos iniciales: ${err.message || err}`, "danger");
  }
}

/* ========== WebSocket (solo push) ========== */
function initSocket() {
  const socket = connectSocket();

  socket.on("connect", () => {
    if (wsStatus) {
      wsStatus.textContent = "WS: ON";
      wsStatus.className = "badge bg-success";
    }
    appendLog("wsLog", "✅ Conectado!", null);
  });

  socket.on("disconnect", () => {
    if (wsStatus) {
      wsStatus.textContent = "WS: OFF";
      wsStatus.className = "badge bg-danger";
    }
    appendLog("wsLog", "⚠️ Desconectado!", null);
  });

  // 👉 Movimiento nuevo: actualizamos buffers y UI (sin REST)
  socket.on("movement:new", (d) => {
    appendLog("wsLog", "🟢 movement:new", d);
    try {
      liveMove.textContent = labelMove(d);
      liveMoveTime.textContent = formatTS(d?.event_at);
      pushEvent(mvLog, d, 10);
      renderTable(tblMoveLog, mvLog, labelMove);
    } catch (err) {
      console.warn("movement:new parse error:", err);
    }
  });

  // 👉 Obstáculo nuevo: actualizamos buffers y UI (sin REST)
  socket.on("obstacle:new", (d) => {
    appendLog("wsLog", "🟡 obstacle:new", d);
    try {
      liveObs.textContent = labelObstacle(d);
      liveObsTime.textContent = formatTS(d?.event_at);
      pushEvent(obLog, d, 10);
      renderTable(tblObsLog, obLog, labelObstacle);
    } catch (err) {
      console.warn("obstacle:new parse error:", err);
    }
  });

  // Logs de DEMO (opcional)
  socket.on("demo:run", (d) => {
    appendLog("wsLog", "🚀 demo:run", d);
  });

  return socket;
}

/* ========== INIT ========== */
document.addEventListener("DOMContentLoaded", async () => {
  if (wsStatus) {
    wsStatus.textContent = "WS: ...";
    wsStatus.className = "badge bg-secondary";
  }
  await loadInitialDataOnce(); // ← una sola vez
  initSocket();                // ← a partir de aquí, SOLO push
  showToast("Monitoreo activo ✅", "success");
});
