/* Configuración Global de la API */

// URL por defecto (Servidor EC2)
const DEFAULT_API_BASE = "http://54.157.99.97:5500";

// Recupera la URL guardada o usa la predeterminada
export let API_BASE = localStorage.getItem("API_BASE") || DEFAULT_API_BASE;

/**
 * Actualiza la URL base del servidor y la persiste en localStorage.
 * Valida que incluya el protocolo http/https.
 */
export function setApiBase(newUrl) {
    if (!newUrl || typeof newUrl !== "string") return;

    newUrl = newUrl.trim();

    if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
        alert("⚠️ La URL debe comenzar con http:// o https://");
        return;
    }

    API_BASE = newUrl;
    localStorage.setItem("API_BASE", API_BASE);

    alert(`✅ Servidor actualizado: ${API_BASE}`);
    console.log("Nueva API_BASE:", API_BASE);
}

export function getApiBase() {
    return API_BASE;
}

export const apiUrl = (path) => `${API_BASE}${path}`;