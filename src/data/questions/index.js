// Aggregates every category bank in this folder. The file name is the category id;
// in each question o[0] is the correct answer (shuffled when the question is prepared).
import { CATEGORIES } from "../categories";

const catIds = new Set(CATEGORIES.map((c) => c.id));
const banks = import.meta.glob(["./*.js", "!./index.js", "!./fff.js"], { eager: true });
const fffBank = import.meta.glob("./fff.js", { eager: true });

export const QUESTIONS = Object.entries(banks).flatMap(([path, mod]) => {
  const c = path.slice(2, -3);
  return catIds.has(c) && Array.isArray(mod.default) ? mod.default.map((q) => ({ ...q, c })) : [];
});

export const FFF_QUESTIONS = Object.values(fffBank)[0]?.default ?? [];

export const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

export const COUNT_BY_CATEGORY = QUESTIONS.reduce((acc, q) => {
  acc[q.c] = (acc[q.c] || 0) + 1;
  return acc;
}, {});
