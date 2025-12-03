/* Catálogos de Movimientos y Obstáculos */

// --- Movimientos ---
export const MOVES = [
  { id: 1,  name: "Adelante" },
  { id: 2,  name: "Atrás" },
  { id: 3,  name: "Detener" },
  { id: 4,  name: "Vuelta adelante derecha" },
  { id: 5,  name: "Vuelta adelante izquierda" },
  { id: 6,  name: "Vuelta atrás derecha" },
  { id: 7,  name: "Vuelta atrás izquierda" },
  { id: 8,  name: "Giro 90° derecha" },
  { id: 9,  name: "Giro 90° izquierda" },
  { id: 10, name: "Giro 360° derecha" },
  { id: 11, name: "Giro 360° izquierda" }
];

// --- Obstáculos ---
export const OBSTACLES = [
  { id: 1, name: "Adelante" },
  { id: 2, name: "Adelante-Izquierda" },
  { id: 3, name: "Adelante-Derecha" },
  { id: 4, name: "Adelante-Izquierda-Derecha" },
  { id: 5, name: "Retrocede" }
];

// --- Mapas para búsqueda rápida por ID ---
export const MOVES_MAP = MOVES.reduce((acc, x) => (acc[x.id] = x, acc), {});
export const OBSTACLES_MAP = OBSTACLES.reduce((acc, x) => (acc[x.id] = x, acc), {});

// --- Helpers ---
export const getMoveById = (id) => MOVES_MAP[id] || null;
export const getObstacleById = (id) => OBSTACLES_MAP[id] || null;

export function randomObstacleId() {
  const idx = Math.floor(Math.random() * OBSTACLES.length);
  return OBSTACLES[idx].id;
}

export function randomObstacle() {
  return OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
}