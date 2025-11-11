// js/config.js
export const DEFAULT_API_BASE = "http://54.157.99.97:5500";

export function apiUrl(path = "") {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${DEFAULT_API_BASE}${path}`;
}

export async function handleResponse(res) {
  if (!res.ok) {
    let detail;
    try { detail = await res.json(); } catch {}
    const msg = detail?.msg || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.detail = detail;
    throw err;
  }
  return res.json();
}
