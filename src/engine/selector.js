// Adaptive question picker.
// For each rung of the ladder there is a target probability of answering correctly (the show's
// rising tension). Given the player's ability for a topic we solve for the ideal difficulty, keep it
// inside the rung's band so the ladder always *feels* like KBC, then score every unseen question by
// difficulty fit, the player's topic relevance settings and variety, and sample from the best few.
import { RELEVANCE_LEVELS, DEFAULT_RELEVANCE } from "../data/categories";
import { DIFF_SCALE, designTheta, logit } from "./rating";
import { clamp, shuffle, weightedIndex } from "../lib/random";

export const TARGET_P = [0.97, 0.95, 0.93, 0.91, 0.88, 0.85, 0.81, 0.77, 0.73, 0.68, 0.62, 0.56, 0.5, 0.44, 0.37, 0.3];
export const BANDS = [
  [1, 2], [1, 3], [1, 3], [1, 4], [2, 4], [2, 5], [3, 5], [3, 6],
  [3, 6], [4, 7], [4, 8], [5, 8], [5, 9], [6, 9], [6, 10], [7, 10],
];

const DAY = 86400000;

export const idealDifficulty = (theta, pTarget) => (theta - logit(pTarget)) * DIFF_SCALE + 5.5;

export function topicWeight(relevance, catId) {
  const level = relevance?.[catId] ?? DEFAULT_RELEVANCE;
  return RELEVANCE_LEVELS[level]?.weight ?? 1;
}

/**
 * @param bank      all questions ({ id, c, d, q, o, f })
 * @param level     ladder rung 1-16
 * @param rating    player rating ({ theta, cats })
 * @param mode      "adaptive" | "classic" | "easy" | "hard"
 * @param relevance { [catId]: 0-4 }
 * @param used      Set of ids already used this game
 * @param seen      { [id]: timestamp } across games
 * @param recent    category ids of this game's questions, oldest first
 * @param mood      shift in target probability (+ = gentler, - = tougher)
 * @param avoidCat  category to steer away from (e.g. when flipping)
 */
export function pickQuestion({ bank, level, rating, mode, relevance, used, seen, recent = [], mood = 0, avoidCat }) {
  const pTarget = clamp(TARGET_P[level - 1] + mood, 0.2, 0.985);
  const [lo, hi] = BANDS[level - 1];
  const last = recent[recent.length - 1];
  const lastThree = recent.slice(-3);
  const counts = recent.reduce((m, c) => ((m[c] = (m[c] || 0) + 1), m), {});
  const now = Date.now();

  const score = (q, allowDisabled) => {
    let w = topicWeight(relevance, q.c);
    if (w <= 0) {
      if (!allowDisabled) return null;
      w = 0.05;
    }
    const dStar = clamp(idealDifficulty(designTheta(rating, q.c, mode), pTarget), lo, hi);
    let s = -0.9 * Math.abs(q.d - dStar) ** 1.4;
    if (q.d < lo || q.d > hi) s -= 2.5;
    s += 1.1 * Math.log(w);
    if (q.c === avoidCat) s -= 6;
    if (q.c === last) s -= 3.5;
    else if (lastThree.includes(q.c)) s -= 1.2;
    s -= 0.7 * (counts[q.c] || 0);
    const seenAt = seen?.[q.id];
    if (seenAt) s -= 8 + 3 * Math.exp(-(now - seenAt) / (30 * DAY)); // repeats only once the unseen pool runs dry
    return s;
  };

  const run = (allowDisabled) => {
    const out = [];
    for (const q of bank) {
      if (used.has(q.id) || q.d < lo - 1 || q.d > hi + 1) continue;
      const s = score(q, allowDisabled);
      if (s != null) out.push([s, q]);
    }
    return out;
  };

  let scored = run(false);
  if (!scored.length) scored = run(true);
  if (!scored.length) {
    const rest = bank.filter((q) => !used.has(q.id));
    return rest.length ? rest[Math.floor(Math.random() * rest.length)] : null;
  }
  scored.sort((a, b) => b[0] - a[0]);
  const top = scored.slice(0, 24);
  const best = top[0][0];
  return top[weightedIndex(top.map(([s]) => Math.exp((s - best) / 0.55)))][1];
}

const leadingNumber = (s) => {
  const m = String(s).trim().match(/^-?\d[\d,]*(\.\d+)?/);
  return m ? parseFloat(m[0].replace(/,/g, "")) : NaN;
};

// Shuffle options (or sort them when they're all numbers/years, like the show does).
export function prepareQuestion(q) {
  const opts = q.o.map((text, i) => ({ text, correct: i === 0 }));
  const numeric = opts.every((o) => Number.isFinite(leadingNumber(o.text)));
  const ordered = numeric ? [...opts].sort((a, b) => leadingNumber(a.text) - leadingNumber(b.text)) : shuffle(opts);
  return {
    id: q.id,
    c: q.c,
    d: q.d,
    q: q.q,
    f: q.f,
    options: ordered.map((o) => o.text),
    answer: ordered.findIndex((o) => o.correct),
  };
}

export function prepareFFF(item) {
  const order = shuffle([0, 1, 2, 3]);
  // options[k] is shown under letter k; `solution` lists option indexes in the correct order.
  return {
    id: item.id,
    c: item.c,
    q: item.q,
    f: item.f,
    options: order.map((i) => item.o[i]),
    solution: [0, 1, 2, 3].map((i) => order.indexOf(i)),
  };
}
