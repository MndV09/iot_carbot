/* =====================================================
   MONITOR EN VIVO — FRONT-END
   - Carga inicial y actualización en tiempo real por WS
   - Último movimiento / obstáculo
   - Últimos 10 de cada uno
   - Indicador de conexión
   - Log visual
===================================================== */

import { movement, obstacle } from "./api.js";
import { connectSocket } from "./sockets.js";
import { MOVES_MAP, OBSTACLES_MAP } from "./catalogs.js";
import { showToast, appendLog } from "./ui.js";

const $ = (s) => document.querySelector(s);

// Lee ?device_id=...; si no viene, usa 1
const DEVICE_ID = Number(new URLSearchParams(location.search).get("device_id") || 1);

// Elements UI
const wsStatus     = $("#wsStatus");
const liveMove     = $("#liveMove");
const liveMoveTime = $("#liveMoveTime");
const liveObs      = $("#liveObs");
const liveObsTime  = $("#liveObsTime");

const tblMoveLog   = $("#tblMoveLog");
const tblObsLog    = $("#tblObsLog");

/* ========== Helpers ========== */

function formatTS(ts) {
  if (!ts) return "...";
  // Acepta "YYYY-MM-DD HH:MM:SS" o ISO; render consistente
  const s = String(ts).replace("T", " ");
  return s.slice(0, 19);
}

function labelMove(ev) {
  const id = Number(ev?.status_clave ?? ev?.move_clave ?? ev?.id);
  return MOVES_MAP[id]?.name ?? `#${id}`;
}

function labelObstacle(ev) {
  const id = Number(ev?.status_clave ?? ev?.obstacle_clave ?? ev?.id);
  return OBSTACLES_MAP[id]?.name ?? `#${id}`;
}

function renderTableMoves(list = []) {
  if (!tblMoveLog) return;
  tblMoveLog.innerHTML = "";
  list.forEach((row, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${labelMove(row)}</td>
      <td>${formatTS(row?.event_at)}</td>
    `;
    tblMoveLog.appendChild(tr);
  });
}

function renderTableObs(list = []) {
  if (!tblObsLog) return;
  tblObsLog.innerHTML = "";
  list.forEach((row, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${labelObstacle(row)}</td>
      <td>${formatTS(row?.event_at)}</td>
    `;
    tblObsLog.appendChild(tr);
  });
}

/* ========== REST Inicial ========== */
async function loadInitialData() {
  try {
    // Último movimiento
    const lastMv = await movement.last(DEVICE_ID);
    const mv = lastMv?.data;
    if (mv) {
      liveMove.textContent = labelMove(mv);
      liveMoveTime.textContent = formatTS(mv?.event_at);
    }

    // Últimos 10 movimientos
    const mv10 = await movement.last10(DEVICE_ID);
    renderTableMoves(mv10?.data || []);

    // Último obstáculo
    const lastOb = await obstacle.last(DEVICE_ID);
    const ob = lastOb?.data;
    if (ob) {
      liveObs.textContent = labelObstacle(ob);
      liveObsTime.textContent = formatTS(ob?.event_at);
    }

    // Últimos 10 obstáculos
    const ob10 = await obstacle.last10(DEVICE_ID);
    renderTableObs(ob10?.data || []);

  } catch (err) {
    console.warn("❌ Error carga inicial:", err);
    showToast(`Error al obtener datos iniciales: ${err.message || err}`, "danger");
  }
}

/* ========== WebSocket ========== */
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

  socket.on("movement:new", (d) => {
    appendLog("wsLog", "🟢 movement:new", d);
    try {
      const id = Number(d?.status_clave ?? d?.move_clave ?? d?.id);
      if (liveMove) liveMove.textContent = MOVES_MAP[id]?.name || `#${id}`;
      if (liveMoveTime) liveMoveTime.textContent = formatTS(d?.event_at);
      loadLast10Moves(); // refresco tabla
    } catch (err) {
      console.warn("movement:new parse error:", err);
    }
  });

  socket.on("obstacle:new", (d) => {
    appendLog("wsLog", "🟡 obstacle:new", d);
    try {
      const id = Number(d?.status_clave ?? d?.obstacle_clave ?? d?.id);
      if (liveObs) liveObs.textContent = OBSTACLES_MAP[id]?.name || `#${id}`;
      if (liveObsTime) liveObsTime.textContent = formatTS(d?.event_at);
      loadLast10Obs(); // refresco tabla
    } catch (err) {
      console.warn("obstacle:new parse error:", err);
    }
  });

  socket.on("demo:run", (d) => {
    appendLog("wsLog", "🚀 demo:run", d);
  });

  return socket;
}

/* ========== Partial refresh ========== */
async function loadLast10Moves() {
  try {
    const res = await movement.last10(DEVICE_ID); // ✅ /last10/<id>
    renderTableMoves(res?.data || []);
  } catch (err) {
    console.warn("loadLast10Moves error:", err);
  }
}

async function loadLast10Obs() {
  try {
    const res = await obstacle.last10(DEVICE_ID); // ✅ /last10/<id>
    renderTableObs(res?.data || []);
  } catch (err) {
    console.warn("loadLast10Obs error:", err);
  }
}

/* ========== INIT ========== */
document.addEventListener("DOMContentLoaded", async () => {
  if (wsStatus) {
    wsStatus.textContent = "WS: ...";
    wsStatus.className = "badge bg-secondary";
  }

  await loadInitialData();
  initSocket();

  showToast("Monitoreo activo ✅", "success");
});
