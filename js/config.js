/* =====================================================
   CONFIGURACIÓN GLOBAL DE API
   Dinámica: editable por el usuario desde la UI
   Se almacena en localStorage para persistencia
===================================================== */

// Valor por defecto (tu servidor en EC2)
const DEFAULT_API_BASE = "http://54.157.99.97:5500";

// Recuperar la URL guardada previamente o usar la predeterminada
export let API_BASE = localStorage.getItem("API_BASE") || DEFAULT_API_BASE;

/**
 * Cambia la URL base del servidor API dinámicamente
 * @param {string} newUrl - ej: http://192.168.1.50:5500 o http://mi-servidor.com:5500
 */
export function setApiBase(newUrl) {
    if (!newUrl || typeof newUrl !== "string") return;

    // Quitar espacios en blanco
    newUrl = newUrl.trim();

    // Validar que empiece con http:// o https://
    if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
        alert("⚠️ La URL debe comenzar con http:// o https://");
        return;
    }

    API_BASE = newUrl;
    localStorage.setItem("API_BASE", API_BASE);

    alert(`✅ Servidor actualizado: ${API_BASE}`);
    console.log("Nueva API_BASE:", API_BASE);
}

/**
 * Obtener URL base actual para debug/logs
 */
export function getApiBase() {
    return API_BASE;
}

/**
 * Construye una URL con la base del servidor
 */
export const apiUrl = (path) => `${API_BASE}${path}`;
