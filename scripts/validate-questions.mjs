#!/usr/bin/env node
// Validates question bank files.
//   node scripts/validate-questions.mjs                 -> every file in src/data/questions
//   node scripts/validate-questions.mjs path/to/x.js    -> just those files
// Regular banks: [{ id, d, q, o: [correct, wrong, wrong, wrong], f }]
// Fastest-finger bank (fff.js): [{ id, c, q, o: [first, second, third, fourth], f }]
import { readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const qdir = path.join(root, "src", "data", "questions");
const { CATEGORIES } = await import(pathToFileURL(path.join(root, "src", "data", "categories.js")).href);
const catIds = new Set(CATEGORIES.map((c) => c.id));
const prefixFor = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.prefix]));

const LIMITS = { q: 160, o: 44, f: 200, fffO: 34 };
const BANNED = /^(both|neither|all|none)$|\b(all of the above|none of the above|none of these|all of these|both [a-d] and [a-d]|neither [a-d] nor [a-d])\b/i;
const TARGET = { 1: 4, 2: 5, 3: 6, 4: 6, 5: 6, 6: 6, 7: 6, 8: 5, 9: 4, 10: 2 };

let args = process.argv.slice(2);
if (!args.length) {
  args = readdirSync(qdir).filter((f) => f.endsWith(".js") && f !== "index.js").map((f) => path.join(qdir, f));
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const seenText = new Map();
const seenIds = new Set();
let errors = 0;
let warnings = 0;
let total = 0;

for (const file of args) {
  const abs = path.resolve(file);
  const base = path.basename(abs, ".js");
  const isFff = base === "fff";
  let data;
  try {
    data = (await import(pathToFileURL(abs).href)).default;
  } catch (e) {
    console.log(`✖ ${base}: failed to import — ${e.message}`);
    errors++;
    continue;
  }
  const err = (i, m) => { errors++; console.log(`  ✖ [${base} #${i} ${data[i]?.id ?? ""}] ${m}`); };
  const warn = (i, m) => { warnings++; console.log(`  ⚠ [${base} #${i} ${data[i]?.id ?? ""}] ${m}`); };
  if (!Array.isArray(data)) { console.log(`✖ ${base}: default export is not an array`); errors++; continue; }
  if (!isFff && !catIds.has(base)) { console.log(`✖ ${base}: file name is not a known category id`); errors++; }
  const prefix = isFff ? "fff" : prefixFor[base];
  const dist = {};

  data.forEach((item, i) => {
    total++;
    if (!item || typeof item !== "object") return err(i, "not an object");
    const { id, d, q, o, f, c } = item;
    if (typeof id !== "string" || !new RegExp(`^${prefix}-\\d{3}$`).test(id)) err(i, `id must look like "${prefix}-001"`);
    if (seenIds.has(id)) err(i, `duplicate id ${id}`);
    seenIds.add(id);
    if (isFff) {
      if (!catIds.has(c)) err(i, `unknown category "${c}"`);
    } else {
      if (!Number.isInteger(d) || d < 1 || d > 10) err(i, "d must be an integer 1-10");
      else dist[d] = (dist[d] || 0) + 1;
    }
    if (typeof q !== "string" || q.trim().length < 10) err(i, "q missing/too short");
    else if (q.length > LIMITS.q) warn(i, `q is ${q.length} chars (max ${LIMITS.q})`);
    if (!Array.isArray(o) || o.length !== 4) err(i, "o must have exactly 4 options");
    else {
      const max = isFff ? LIMITS.fffO : LIMITS.o;
      o.forEach((opt, j) => {
        if (typeof opt !== "string" || !opt.trim()) err(i, `option ${j} empty`);
        else {
          if (opt.length > max) warn(i, `option "${opt}" is ${opt.length} chars (max ${max})`);
          if (BANNED.test(opt)) err(i, `banned option text "${opt}" (options are shuffled)`);
          if (opt !== opt.trim()) warn(i, `option "${opt}" has stray whitespace`);
        }
      });
      if (new Set(o.map((x) => String(x).toLowerCase().trim())).size !== 4) err(i, "options are not unique");
    }
    if (typeof f !== "string" || f.trim().length < 10) err(i, "f (fact) missing/too short");
    else if (f.length > LIMITS.f) warn(i, `f is ${f.length} chars (max ${LIMITS.f})`);
    if (typeof q === "string") {
      const key = norm(q);
      if (seenText.has(key)) err(i, `duplicate question text (also ${seenText.get(key)})`);
      else seenText.set(key, `${base}:${id}`);
    }
  });

  const distStr = isFff ? "" : " | d: " + Object.keys(TARGET).map((k) => `${k}:${dist[k] || 0}`).join(" ");
  console.log(`${errors ? "•" : "✔"} ${base}: ${data.length} questions${distStr}`);
}

console.log(`\n${total} questions checked — ${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
