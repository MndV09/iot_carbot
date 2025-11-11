// js/api.js
import { DEFAULT_API_BASE, apiUrl, handleResponse } from "./config.js";

export const GET = async (path) =>
  handleResponse(await fetch(apiUrl(path), { method: "GET", mode: "cors" }));

export const POST = async (path, body) =>
  handleResponse(await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    mode: "cors",
    body: JSON.stringify(body)
  }));

export const demo = {
  last20: async (owner) => {
    const id = Number(owner) || 0;
    if (id > 0) {
      let res = await fetch(`${DEFAULT_API_BASE}/api/demo/last20/${id}`, { mode: "cors" });
      if (res.status !== 404) return handleResponse(res);
      res = await fetch(`${DEFAULT_API_BASE}/api/demo/last20?owner=${id}`, { mode: "cors" });
      return handleResponse(res);
    }
    let res = await fetch(`${DEFAULT_API_BASE}/api/demo/last20`, { mode: "cors" });
    if (res.status !== 404) return handleResponse(res);
    res = await fetch(`${DEFAULT_API_BASE}/api/demo/last20?owner=0`, { mode: "cors" });
    return handleResponse(res);
  },
  create: (payload) => POST("/api/demo/create", payload),
  run:    (payload) => POST("/api/demo/run", payload),
};

export const movement = {
  add:    (payload) => POST("/api/movement/add", payload),
  last:   (id)      => GET(`/api/movement/last/${id}`),
  last10: (id)      => GET(`/api/movement/last10/${id}`),
};

export const obstacle = {
  add:    (payload) => POST("/api/obstacle/add", payload),
  last:   (id)      => GET(`/api/obstacle/last/${id}`),
  last10: (id)      => GET(`/api/obstacle/last10/${id}`),
};
