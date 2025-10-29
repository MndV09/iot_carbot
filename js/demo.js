/* =====================================================
   DEMO AUTOMÁTICA — Front-End
   - Constructor visual de pasos (catálogo MOVES)
   - Crear DEMO (POST /api/demo/create)
   - Listar últimas 20 (GET /api/demo/last20)
   - Ejecutar DEMO (POST /api/demo/run)
   - WebSocket push: demo:new, demo:run
===================================================== */

import { MOVES, MOVES_MAP } from "./catalogs.js";
import { demo } from "./api.js";
import { connectSocket } from "./sockets.js";
import { showToast, appendLog } from "./ui.js";

const $ = (sel) => document.querySelector(sel);

// ------- DOM -------
const selMove        = $("#selMove");
const inpDuration    = $("#inpDuration");
const btnAddStep     = $("#btnAddStep");
const btnLoadExample = $("#btnLoadExample");
const btnClearSteps  = $("#btnClearSteps");
const tblSteps       = $("#tblSteps");

const inpDemoName    = $("#inpDemoName");
const inpOwnerDevice = $("#inpOwnerDevice");
const taStepsJson    = $("#taStepsJson");
const btnCreateDemo  = $("#btnCreateDemo");

const btnRefreshDemos = $("#btnRefreshDemos");
const selDemo         = $("#selDemo");
const inpRunDevice    = $("#inpRunDevice");
const inpRunDelay     = $("#inpRunDelay");
const btnRunDemo      = $("#btnRunDemo");

const currentAction  = $("#currentAction");
const demoLog        = $("#demoLog");

// ------- Estado -------
let steps = []; // {status_clave, duration_ms}

// ------- Helpers -------
function renderMoveCatalog() {
  selMove.innerHTML = `<option disabled selected value="">Seleccione movimiento…</option>`;
  MOVES.forEach(m => {
    const opt = document.createElement("option");
    opt.value = String(m.id);
    opt.textContent = `${m.id} • ${m.name}`;
    selMove.appendChild(opt);
  });
}

function renderStepsTable() {
  tblSteps.innerHTML = "";
  steps.forEach((s, idx) => {
    const tr = document.createElement("tr");

    const tdIdx = document.createElement("td");
    tdIdx.textContent = String(idx + 1);

    const tdMove = document.createElement("td");
    tdMove.textContent = `${s.status_clave} • ${MOVES_MAP[s.status_clave]?.name ?? "?"}`;

    const tdDur = document.createElement("td");
    tdDur.textContent = String(s.duration_ms);

    const tdAct = document.createElement("td");
    tdAct.className = "d-flex gap-1";

    const btnUp = document.createElement("button");
    btnUp.className = "btn btn-outline-light btn-sm";
    btnUp.textContent = "↑";
    btnUp.disabled = idx === 0;
    btnUp.addEventListener("click", () => moveStep(idx, -1));

    const btnDown = document.createElement("button");
    btnDown.className = "btn btn-outline-light btn-sm";
    btnDown.textContent = "↓";
    btnDown.disabled = idx === steps.length - 1;
    btnDown.addEventListener("click", () => moveStep(idx, +1));

    const btnDel = document.createElement("button");
    btnDel.className = "btn btn-outline-danger btn-sm";
    btnDel.textContent = "Eliminar";
    btnDel.addEventListener("click", () => deleteStep(idx));

    tdAct.append(btnUp, btnDown, btnDel);

    tr.append(tdIdx, tdMove, tdDur, tdAct);
    tblSteps.appendChild(tr);
  });

  // Reflejar JSON generado
  taStepsJson.value = JSON.stringify(steps, null, 2);
}

function moveStep(idx, dir) {
  const j = idx + dir;
  if (j < 0 || j >= steps.length) return;
  [steps[idx], steps[j]] = [steps[j], steps[idx]];
  renderStepsTable();
}

function deleteStep(idx) {
  steps.splice(idx, 1);
  renderStepsTable();
}

function addStepFromUI() {
  const moveId = Number(selMove.value);
  const duration = Number(inpDuration.value);

  if (!moveId || !MOVES_MAP[moveId]) {
    showToast("Selecciona un movimiento válido", "warning");
    selMove.focus();
    return;
  }
  if (!duration || duration < 100) {
    showToast("Duración mínima 100 ms", "warning");
    inpDuration.focus();
    return;
  }

  steps.push({ status_clave: moveId, duration_ms: duration });
  renderStepsTable();
  // Limpieza ligera
  selMove.value = "";
  inpDuration.value = "";
  selMove.focus();
}

function loadExampleSteps() {
  steps = [
    { status_clave: 1,  duration_ms: 800 },  // Adelante
    { status_clave: 8,  duration_ms: 500 },  // 90° derecha
    { status_clave: 1,  duration_ms: 800 },  // Adelante
    { status_clave: 9,  duration_ms: 500 },  // 90° izquierda
    { status_clave: 3,  duration_ms: 300 }   // Detener
  ];
  renderStepsTable();
}

function clearSteps() {
  steps = [];
  renderStepsTable();
}

function labelAction(d) {
  const id = Number(d?.status_clave ?? d?.move_clave ?? d?.id);
  const name = MOVES_MAP[id]?.name ?? `#${id}`;
  const ts = d?.event_at || d?.created_at || "";
  return `${name} ${ts ? `(${ts})` : ""}`;
}

// ------- REST -------
async function createDemo() {
  let name = (inpDemoName.value || "").trim();
  const ownerId = Number(inpOwnerDevice.value || "1");

  if (!name) {
    name = `DEMO_${Date.now()}`;  // nombre único por defecto
    inpDemoName.value = name;
  }
  if (!steps.length) {
    showToast("Agrega al menos un paso", "warning");
    return;
  }

  const payload = {
    name,
    owner_device_id: ownerId,
    steps_json: JSON.stringify(steps)
  };

  try {
    const res = await demo.create(payload);
    showToast("DEMO creada ✅", "success");
    appendLog("demoLog", "DEMO creada", res?.data);
    await refreshDemos();
  } catch (err) {
    // Si es 500, reintenta una vez con sufijo único (posible duplicado)
    console.error("createDemo error:", err);
    showToast("Servidor respondió 500; intentando con nombre único…", "warning");
    try {
      const unique = `${name}_${Date.now()}`;
      inpDemoName.value = unique;
      const res2 = await demo.create({
        ...payload,
        name: unique
      });
      showToast("DEMO creada con nombre único ✅", "success");
      appendLog("demoLog", "DEMO creada (retry)", res2?.data);
      await refreshDemos();
    } catch (err2) {
      console.error("createDemo retry error:", err2);
      showToast("No se pudo crear la DEMO (ver consola)", "danger");
    }
  }
}


async function refreshDemos() {
  selDemo.innerHTML = `<option disabled selected value="">Seleccione DEMO…</option>`;
  try {
    const res = await demo.last20();
    const list = res?.data || [];
    list.forEach(row => {
      const opt = document.createElement("option");
      opt.value = String(row.sequence_id ?? row.id);
      opt.textContent = `${row.sequence_id ?? row.id} • ${row.name} (${row.steps_count ?? "?"} pasos)`;
      selDemo.appendChild(opt);
    });
    showToast(`Cargadas ${list.length} DEMO(s)`, "info");
  } catch (err) {
    console.warn("refreshDemos error:", err);
    showToast("No se pudo cargar la lista de DEMO", "danger");
  }
}

async function runSelectedDemo() {
  const seq = Number(selDemo.value);
  if (!seq) {
    showToast("Selecciona una DEMO", "warning");
    return;
  }

  const deviceId = Number(inpRunDevice.value || "1");
  const delayMs  = Number(inpRunDelay.value || "0");

  try {
    const res = await demo.run({
      sequence_id: seq,
      device_id: deviceId,
      start_delay_ms: delayMs
    });
    showToast("DEMO en ejecución 🚀", "success");
    appendLog("demoLog", "DEMO en ejecución", res?.data);
  } catch (err) {
    console.error("runSelectedDemo error:", err);
    showToast("No se pudo ejecutar la DEMO", "danger");
  }
}

// ------- WebSocket -------
function initSocket() {
  const socket = connectSocket();

  socket.on("server_info", (d) => {
    appendLog("demoLog", "server_info", d);
  });

  socket.on("demo:new", (d) => {
    appendLog("demoLog", "🟣 demo:new", d);
    // auto refresh para verla en el select
    refreshDemos();
  });

  socket.on("demo:run", (d) => {
    appendLog("demoLog", "🟡 demo:run", d);
    // Si llega detalle de step en ejecución
    if (Array.isArray(d?.steps) && d.steps.length) {
      const step = d.steps[0]; // algunos backends mandan step actual
      const label = labelAction(step);
      currentAction.textContent = label;
    } else if (d?.current_step) {
      const label = labelAction(d.current_step);
      currentAction.textContent = label;
    } else if (d?.status_clave) {
      const label = labelAction(d);
      currentAction.textContent = label;
    }
  });

  return socket;
}

// ------- Wire UI -------
function wireUI() {
  btnAddStep.addEventListener("click", addStepFromUI);
  btnLoadExample.addEventListener("click", loadExampleSteps);
  btnClearSteps.addEventListener("click", clearSteps);

  btnCreateDemo.addEventListener("click", createDemo);
  btnRefreshDemos.addEventListener("click", refreshDemos);
  btnRunDemo.addEventListener("click", runSelectedDemo);

  // Enter en duración agrega paso (si hay movimiento seleccionado)
  inpDuration.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addStepFromUI();
    }
  });
}

// ------- Init -------
document.addEventListener("DOMContentLoaded", async () => {
  renderMoveCatalog();
  wireUI();
  initSocket();
  await refreshDemos();
  currentAction.textContent = "...";
});
