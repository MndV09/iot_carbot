/* =====================================================
   UI HELPERS — IoT Carbot Front-End
   - Toasters (Bootstrap)
   - Render de estados simples
   - Logs en consola y en paneles
===================================================== */

// Alias simple
const $ = (sel) => document.querySelector(sel);

/* -----------------------------
 ✅ Sistema de Notificaciones
--------------------------------*/
export function showToast(message, type = "info") {
  const colors = {
    success: "#198754", // verde
    info:    "#0dcaf0", // celeste
    warning: "#ffc107", // amarillo
    danger:  "#dc3545"  // rojo
  };

  // Crear un contenedor si no existe
  let container = $("#toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.style.position = "fixed";
    container.style.top = "1rem";
    container.style.right = "1rem";
    container.style.zIndex = "9999";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `text-white rounded shadow p-2 mt-2`;
  toast.style.backgroundColor = colors[type] || colors.info;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

/* -----------------------------
 ✅ Mostrar valores en DOM
--------------------------------*/
export function setText(id, value) {
  const el = $(`#${id}`);
  if (el) el.textContent = value;
}

/* -----------------------------
 ✅ Logger visual opcional
--------------------------------*/
export function appendLog(containerId, text, data = null) {
  const box = $(`#${containerId}`);
  if (!box) return;
  
  const row = document.createElement("div");
  row.className = "log-row small";
  row.textContent = `${new Date().toLocaleTimeString()} → ${text}`;
  
  if (data) {
    row.textContent += " " + JSON.stringify(data);
  }

  box.prepend(row); // se añade arriba como timeline
}

/* -----------------------------
 ✅ Loader pequeño (texto)
--------------------------------*/
export function loadingText(id, text = "Cargando...") {
  setText(id, `⏳ ${text}`);
}

export function clearLoadingText(id, fallback = "...") {
  setText(id, fallback);
}

/* -----------------------------
 ✅ Representación formateada de movimiento
--------------------------------*/
export function movementLabel(mv) {
  const status = mv?.status_texto || mv?.status || mv?.name;
  const ts = mv?.event_at || mv?.created_at;
  return `${status ?? "?"} (${ts ?? "..."})`;
}
