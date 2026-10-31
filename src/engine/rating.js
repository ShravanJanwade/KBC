// Player model: a one-parameter IRT (Rasch) ability `theta`, updated Elo-style after every answer,
// plus a per-topic offset so the game learns what each player is strong or weak at.
import { clamp } from "../lib/random";

export const DIFF_SCALE = 1.25;
export const difficultyParam = (d) => (d - 5.5) / DIFF_SCALE; // d1 ≈ -3.6 … d10 ≈ +3.6
export const pCorrect = (theta, d) => 1 / (1 + Math.exp(-(theta - difficultyParam(d))));
export const logit = (p) => Math.log(p / (1 - p));

export const SKILL_LEVELS = [
  { id: "beginner", name: "Beginner", hi: "Shuruaat", desc: "Here for fun — ease me in.", theta: -0.6 },
  { id: "enthusiast", name: "Enthusiast", hi: "Shaukeen", desc: "I know my GK pretty well.", theta: 0 },
  { id: "master", name: "Quiz Master", hi: "Ustaad", desc: "Bring on the ₹7 crore question.", theta: 0.75 },
];

export function newRating(level = "enthusiast") {
  const start = SKILL_LEVELS.find((l) => l.id === level)?.theta ?? 0;
  return { theta: start, n: 0, cats: {} };
}

export const iqOf = (theta) => Math.round(1000 + 150 * theta);

export const TIERS = [
  { min: -Infinity, name: "Naya Khiladi", en: "Rookie", color: "#9aa7c7" },
  { min: 850, name: "Jigyasu", en: "Curious Mind", color: "#45d4ff" },
  { min: 1000, name: "Gyani", en: "Knowledgeable", color: "#34d399" },
  { min: 1150, name: "Vidwan", en: "Scholar", color: "#b392ff" },
  { min: 1300, name: "Mahagyani", en: "Grandmaster", color: "#fbbf24" },
];

export function tierOf(iq) {
  let i = 0;
  while (i + 1 < TIERS.length && iq >= TIERS[i + 1].min) i++;
  const tier = TIERS[i];
  const next = TIERS[i + 1] ?? null;
  const floor = Number.isFinite(tier.min) ? tier.min : 700;
  const progress = next ? clamp((iq - floor) / (next.min - floor), 0, 1) : 1;
  return { ...tier, index: i, next, progress };
}

// Ability for a topic: global theta plus a shrunk topic offset (trust grows with answers seen).
export function topicTheta(rating, catId) {
  const c = rating.cats?.[catId];
  if (!c) return rating.theta;
  return rating.theta + (c.n / (c.n + 6)) * c.delta;
}

const MODE_SHIFT = { adaptive: 0, easy: -1.1, hard: 1.1 };

// The ability the question picker designs for. "classic" ignores the player and follows the show curve.
export function designTheta(rating, catId, mode) {
  if (mode === "classic") return 0;
  return topicTheta(rating, catId) + (MODE_SHIFT[mode] ?? 0);
}

export function updateRating(rating, { catId, d, correct, assisted = false, fast = false, timedOut = false }) {
  const p = pCorrect(topicTheta(rating, catId), d);
  const outcome = correct ? 1 : 0;
  let k = 0.36 / (1 + rating.n / 40) + 0.06;
  if (assisted) k *= correct ? 0.35 : 0.6; // lifelines muddy the signal
  if (correct && fast) k *= 1.2; // quick and right = confident knowledge
  if (timedOut) k *= 0.5;
  const step = k * (outcome - p);
  const prev = rating.cats?.[catId] ?? { delta: 0, n: 0, right: 0 };
  return {
    theta: clamp(rating.theta + step, -3.5, 3.5),
    n: rating.n + 1,
    cats: {
      ...rating.cats,
      [catId]: { delta: clamp(prev.delta + step * 0.8, -2.5, 2.5), n: prev.n + 1, right: prev.right + outcome },
    },
  };
}
