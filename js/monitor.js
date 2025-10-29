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
import { MOVES_MAP, OBSTACLES, OBSTACLES_MAP } from "./catalogs.js";
import { showToast, appendLog } from "./ui.js";

const $ = (s) => document.querySelector(s);

const DEVICE_ID = Number(localStorage.getItem("DEVICE_ID") || "1");

// Elements UI
const wsStatus      = $("#wsStatus");
const liveMove      = $("#liveMove");
const liveMoveTime  = $("#liveMoveTime");
const liveObs       = $("#liveObs");
const liveObsTime   = $("#liveObsTime");

const tblMoveLog    = $("#tblMoveLog");
const tblObsLog     = $("#tblObsLog");
const wsLog         = $("#wsLog");

/* ========== Helpers ========== */

function formatTS(ts) {
  if (!ts) return "...";
  return ts.replace("T", " ").slice(0, 19);
}

function labelMove(ev) {
  const id = Number(ev?.status_clave ?? ev?.move_clave ?? ev?.id);
  return MOVES_MAP[id]?.name ?? `#${id}`;
}

function labelObstacle(ev) {
  const id = Number(ev?.status_clave ?? ev?.obstacle_clave ?? ev?.id);
  return OBSTACLES_MAP[id]?.name ?? `#${id}`;
}

function renderTableMoves(list) {
  tblMoveLog.innerHTML = "";
  list.forEach((row, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${labelMove(row)}</td>
      <td>${formatTS(row.event_at)}</td>
    `;
    tblMoveLog.appendChild(tr);
  });
}

function renderTableObs(list) {
  tblObsLog.innerHTML = "";
  list.forEach((row, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${labelObstacle(row)}</td>
      <td>${formatTS(row.event_at)}</td>
    `;
    tblObsLog.appendChild(tr);
  });
}

/* ========== REST Inicial ========== */
async function loadInitialData() {
  try {
    const lastMv = await movement.last(DEVICE_ID);
    const mv = lastMv?.data;
    if (mv) {
      liveMove.textContent = labelMove(mv);
      liveMoveTime.textContent = formatTS(mv.event_at);
    }

    const mv10 = await movement.last10(DEVICE_ID);
    renderTableMoves(mv10?.data || []);

    const lastOb = await obstacle.last(DEVICE_ID);
    const ob = lastOb?.data;
    if (ob) {
      liveObs.textContent = labelObstacle(ob);
      liveObsTime.textContent = formatTS(ob.event_at);
    }

    const ob10 = await obstacle.last10(DEVICE_ID);
    renderTableObs(ob10?.data || []);

  } catch (err) {
    console.warn("❌ Error carga inicial:", err);
    showToast("Error al obtener datos iniciales", "danger");
  }
}

/* ========== WebSocket ========== */
function initSocket() {
  const socket = connectSocket();

  socket.on("connect", () => {
    wsStatus.textContent = "WS: ON";
    wsStatus.className = "badge bg-success";
    appendLog("wsLog", "✅ Conectado!", null);
  });

  socket.on("disconnect", () => {
    wsStatus.textContent = "WS: OFF";
    wsStatus.className = "badge bg-danger";
    appendLog("wsLog", "⚠️ Desconectado!", null);
  });

  socket.on("movement:new", (d) => {
    appendLog("wsLog", "🟢 movement:new", d);

    try {
      const id = Number(d?.status_clave ?? d?.move_clave ?? d?.id);
      liveMove.textContent = MOVES_MAP[id]?.name || `#${id}`;
      liveMoveTime.textContent = formatTS(d.event_at);

      loadLast10Moves(); // refresco tabla
    } catch (err) {
      console.warn("movement:new parse error: ", err);
    }
  });

  socket.on("obstacle:new", (d) => {
    appendLog("wsLog", "🟡 obstacle:new", d);

    try {
      const id = Number(d?.status_clave ?? d?.obstacle_clave ?? d?.id);
      liveObs.textContent = OBSTACLES_MAP[id]?.name || `#${id}`;
      liveObsTime.textContent = formatTS(d.event_at);

      loadLast10Obs(); // refresco tabla
    } catch (err) {
      console.warn("obstacle:new parse error: ", err);
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
    const res = await movement.last10(DEVICE_ID);
    renderTableMoves(res?.data || []);
  } catch {}
}

async function loadLast10Obs() {
  try {
    const res = await obstacle.last10(DEVICE_ID);
    renderTableObs(res?.data || []);
  } catch {}
}

/* ========== INIT ========== */
document.addEventListener("DOMContentLoaded", async () => {
  wsStatus.textContent = "WS: ...";
  wsStatus.className = "badge bg-secondary";

  await loadInitialData();
  initSocket();

  showToast("Monitoreo activo ✅", "success");
});
