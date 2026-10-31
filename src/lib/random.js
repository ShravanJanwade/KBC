export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const chance = (p) => Math.random() < p;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Standard normal via Box–Muller.
export function gaussian() {
  let u = 0;
  let v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function weightedIndex(weights) {
  const total = weights.reduce((s, w) => s + Math.max(0, w), 0);
  if (total <= 0) return Math.floor(Math.random() * weights.length);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= Math.max(0, weights[i]);
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

// Round a list of non-negative shares so they total exactly `total`.
export function roundToTotal(values, total = 100) {
  const sum = values.reduce((s, v) => s + v, 0) || 1;
  const scaled = values.map((v) => (v / sum) * total);
  const floors = scaled.map(Math.floor);
  let rest = total - floors.reduce((s, v) => s + v, 0);
  const order = scaled.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; k < order.length && rest > 0; k++, rest--) floors[order[k][1]]++;
  return floors;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
