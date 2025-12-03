/* Helpers de UI */
const $ = (sel) => document.querySelector(sel);

// Sistema de notificaciones tipo "Toast"
export function showToast(message, type = "info") {
  const colors = {
    success: "#198754", 
    info:    "#0dcaf0", 
    warning: "#ffc107", 
    danger:  "#dc3545" 
  };

  let container = $("#toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    Object.assign(container.style, {
        position: "fixed", top: "1rem", right: "1rem", zIndex: "9999"
    });
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `text-white rounded shadow p-2 mt-2`;
  toast.style.backgroundColor = colors[type] || colors.info;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Actualiza texto en el DOM por ID
export function setText(id, value) {
  const el = $(`#${id}`);
  if (el) el.textContent = value;
}

// Agrega logs visuales tipo timeline
export function appendLog(containerId, text, data = null) {
  const box = $(`#${containerId}`);
  if (!box) return;
  
  const row = document.createElement("div");
  row.className = "log-row small";
  row.textContent = `${new Date().toLocaleTimeString()} → ${text}`;
  
  if (data) {
    row.textContent += " " + JSON.stringify(data);
  }

  box.prepend(row); 
}

export function loadingText(id, text = "Cargando...") {
  setText(id, `⏳ ${text}`);
}

export function clearLoadingText(id, fallback = "...") {
  setText(id, fallback);
}

export function movementLabel(mv) {
  const status = mv?.status_texto || mv?.status || mv?.name;
  const ts = mv?.event_at || mv?.created_at;
  return `${status ?? "?"} (${ts ?? "..."})`;
}