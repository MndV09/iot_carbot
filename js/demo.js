/* Gestión de Demos (Secuencias Automáticas) */

import { MOVES, MOVES_MAP } from "./catalogs.js";
import { demo } from "./api.js";
import { connectSocket } from "./sockets.js";
import { showToast, appendLog } from "./ui.js";

const $ = (sel) => document.querySelector(sel);

// Referencias DOM
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

// Limpieza de UI antigua
const _oldDiag = document.getElementById("diagBox");
if (_oldDiag) _oldDiag.remove();

// Estado local
let steps = [];           
let demosCache = [];      

// --- Renderizado de UI ---
function renderMoveCatalog() {
  if (!selMove) return;
  selMove.innerHTML = `<option disabled selected value="">Seleccione movimiento…</option>`;
  MOVES.forEach(m => {
    const opt = document.createElement("option");
    opt.value = String(m.id);
    opt.textContent = `${m.id} • ${m.name}`;
    selMove.appendChild(opt);
  });
}

function renderStepsTable() {
  if (!tblSteps) return;
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

    // Botones de acción (Subir, Bajar, Eliminar)
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

  if (taStepsJson) taStepsJson.value = JSON.stringify(steps, null, 2);
}

// --- Manipulación de pasos ---
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

function addStepFromUI(e) {
  if (e) e.preventDefault();

  const moveId = Number(selMove?.value || NaN);
  let duration = Number(inpDuration?.value || NaN);

  if (!moveId || !MOVES_MAP[moveId]) {
    showToast("Selecciona un movimiento válido", "warning");
    selMove?.focus();
    return;
  }

  // Duración por defecto segura si no es válida
  if (!Number.isFinite(duration) || duration < 100) {
    duration = 800;
    if (inpDuration) inpDuration.value = String(duration);
  }

  steps.push({ status_clave: moveId, duration_ms: duration });
  renderStepsTable();

  if (selMove) selMove.value = "";
  if (inpDuration) inpDuration.value = "";
  selMove?.focus();
}

function clearSteps() { steps = []; renderStepsTable(); }

function loadExampleSteps() {
  steps = [
    { status_clave: 1,  duration_ms: 800 },
    { status_clave: 8,  duration_ms: 500 },
    { status_clave: 1,  duration_ms: 800 },
    { status_clave: 9,  duration_ms: 500 },
    { status_clave: 3,  duration_ms: 300 }
  ];
  renderStepsTable();
}

function labelAction(d) {
  const id = Number(d?.status_clave ?? d?.move_clave ?? d?.id);
  const name = MOVES_MAP[id]?.name ?? `#${id}`;
  const ts = d?.event_at || d?.created_at || "";
  return `${name} ${ts ? `(${ts})` : ""}`;
}

// --- Gestión de Demos (Carga y Selección) ---
function renderDemosSelect() {
  if (!selDemo) return;
  selDemo.innerHTML = `<option disabled selected value="">Seleccione DEMO…</option>`;
  demosCache.forEach(row => {
    const opt = document.createElement("option");
    opt.value = String(row.sequence_id ?? row.id);
    opt.textContent = `${row.sequence_id ?? row.id} • ${row.name} (${row.steps_count ?? "?"} pasos)`;
    selDemo.appendChild(opt);
  });
}

async function refreshDemos() {
  try {
    const res = await demo.last20();
    demosCache = res?.data || [];
    renderDemosSelect();
  } catch (err) {
    console.warn("refreshDemos error:", err);
    showToast("No se pudo cargar la lista de DEMO", "danger");
  }
}

// --- Creación y Ejecución ---
async function createDemo() {
  let name = (inpDemoName?.value || "").trim();
  const ownerId = Number(inpOwnerDevice?.value || "1");

  if (!name) {
    name = `DEMO_${Date.now()}`;
    if (inpDemoName) inpDemoName.value = name;
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
    console.error("createDemo error:", err);
    showToast("Error. Reintentando con nombre único…", "warning");
    // Retry logic con timestamp
    try {
      const unique = `${name}_${Date.now()}`;
      if (inpDemoName) inpDemoName.value = unique;
      const res2 = await demo.create({ ...payload, name: unique });
      showToast("DEMO creada (retry) ✅", "success");
      appendLog("demoLog", "DEMO creada (retry)", res2?.data);
      await refreshDemos();
    } catch (err2) {
      console.error("createDemo retry error:", err2);
      showToast("No se pudo crear la DEMO", "danger");
    }
  }
}

async function runSelectedDemo() {
  const seq = Number(selDemo?.value);
  if (!seq) return showToast("Selecciona una DEMO", "warning");
  
  const deviceId = Number(inpRunDevice?.value || "1");
  const delayMs  = Number(inpRunDelay?.value || "0");
  
  try {
    const res = await demo.run({ sequence_id: seq, device_id: deviceId, start_delay_ms: delayMs });
    showToast("DEMO en ejecución 🚀", "success");
    appendLog("demoLog", "DEMO en ejecución", res?.data);
  } catch (err) {
    console.error("runSelectedDemo error:", err);
    showToast("No se pudo ejecutar la DEMO", "danger");
  }
}

// --- WebSocket Listeners ---
function initSocket() {
  const socket = connectSocket();

  socket.on("server_info", (d) => appendLog("demoLog", "server_info", d));

  // Actualizar lista al recibir nueva demo
  socket.on("demo:new", (d) => {
    appendLog("demoLog", "🟣 demo:new", d);
    refreshDemos();
  });

  // Mostrar progreso al ejecutar demo
  socket.on("demo:run", (d) => {
    appendLog("demoLog", "🟡 demo:run", d);
    if (Array.isArray(d?.steps) && d.steps.length) {
      currentAction && (currentAction.textContent = labelAction(d.steps[0]));
    } else if (d?.current_step) {
      currentAction && (currentAction.textContent = labelAction(d.current_step));
    } else if (d?.status_clave) {
      currentAction && (currentAction.textContent = labelAction(d));
    } else {
      currentAction && (currentAction.textContent = "...");
    }
  });

  return socket;
}

// --- Inicialización ---
function wireUI() {
  btnAddStep   && btnAddStep.addEventListener("click", addStepFromUI);
  btnLoadExample && btnLoadExample.addEventListener("click", loadExampleSteps);
  btnClearSteps  && btnClearSteps.addEventListener("click", clearSteps);

  btnCreateDemo && btnCreateDemo.addEventListener("click", createDemo);
  btnRefreshDemos && btnRefreshDemos.addEventListener("click", refreshDemos);
  btnRunDemo && btnRunDemo.addEventListener("click", runSelectedDemo);

  inpDuration && inpDuration.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); addStepFromUI(e); }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  renderMoveCatalog();
  wireUI();
  initSocket();
  await refreshDemos();
  if (currentAction) currentAction.textContent = "...";
});