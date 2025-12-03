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

// Buffers locales (máx 8)
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
    // Usamos event_id o id según tu base de datos
    const realId = row.event_id || row.id || "ID?";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${realId}</td>
      <td>${labelFn(row)}</td>
      <td>${formatTS(row?.event_at)}</td>
    `;
    target.appendChild(tr);
  });
}

// CAMBIO 1: El valor por defecto ahora es 8 (aunque lo pasaremos explícito abajo)
function pushEvent(buffer, ev, max = 7) {
  buffer.unshift(ev);
  if (buffer.length > max) buffer.length = max;
}

/* ========== Carga inicial (una sola vez) ========== */
async function loadInitialDataOnce() {
  try {
    // Pedimos los últimos 10 a la API (porque el SP da 10), pero solo usaremos 8
    const [lastMv, mv10, lastOb, ob10] = await Promise.all([
      movement.last(DEVICE_ID), movement.last10(DEVICE_ID),
      obstacle.last(DEVICE_ID), obstacle.last10(DEVICE_ID)
    ]);

    const mv = lastMv?.data;
    if (mv) {
      liveMove.textContent = labelMove(mv);
      liveMoveTime.textContent = formatTS(mv?.event_at);
    }
    
    // CAMBIO 2: Cortamos el array inicial a solo 8 elementos
    mvLog = (mv10?.data || []).slice(0, 7); 
    renderTable(tblMoveLog, mvLog, labelMove);

    const ob = lastOb?.data;
    if (ob) {
      liveObs.textContent = labelObstacle(ob);
      liveObsTime.textContent = formatTS(ob?.event_at);
    }
    
    // CAMBIO 3: Cortamos el array inicial a solo 8 elementos
    obLog = (ob10?.data || []).slice(0, 7);
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

  socket.on("movement:new", (d) => {
    appendLog("wsLog", "🟢 movement:new", d);
    try {
      liveMove.textContent = labelMove(d);
      liveMoveTime.textContent = formatTS(d?.event_at);
      
      // CAMBIO 4: Limitamos el buffer a 8 al insertar nuevos
      pushEvent(mvLog, d, 7); 
      renderTable(tblMoveLog, mvLog, labelMove);
    } catch (err) {
      console.warn("movement:new parse error:", err);
    }
  });

  socket.on("obstacle:new", (d) => {
    appendLog("wsLog", "🟡 obstacle:new", d);
    try {
      liveObs.textContent = labelObstacle(d);
      liveObsTime.textContent = formatTS(d?.event_at);
      
      // CAMBIO 5: Limitamos el buffer a 8 al insertar nuevos
      pushEvent(obLog, d, 7);
      renderTable(tblObsLog, obLog, labelObstacle);
    } catch (err) {
      console.warn("obstacle:new parse error:", err);
    }
  });

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
  await loadInitialDataOnce();
  initSocket();
  showToast("Monitoreo activo ✅", "success");
});