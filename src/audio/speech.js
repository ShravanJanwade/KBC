// Voice direction on top of the Web Speech API.
// - Casts the best installed voice for each character (Microsoft "Natural"/neural voices first,
//   Indian English and Hindi preferred) and keeps characters on distinct voices where possible.
// - Delivers lines expressively: moods change pace and pitch, "..." makes a dramatic pause and
//   "|" a short one, so "Saat... crore!" lands like it does on TV.
// - Every new line interrupts the previous one; cancelSpeech() silences everything.
import { audio } from "./engine";

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
export const speechSupported = !!synth;

let voices = [];
const listeners = new Set();
const cache = new Map();
function refresh() {
  voices = synth?.getVoices() ?? [];
  cache.clear();
  listeners.forEach((fn) => fn(voices));
}
if (synth) {
  refresh();
  synth.addEventListener?.("voiceschanged", refresh);
}
export const getVoices = () => voices;
export function onVoicesChanged(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const config = { rate: 1, hostHi: "", hostEn: "", oneVoice: true };
export function configureSpeech(patch) {
  Object.assign(config, patch);
  cache.clear();
}

const NATURAL = /natural|neural|online|enhanced|premium/i;
const FEMALE = /(female|neerja|swara|heera|kalpana|aashi|ananya|kavya|aarohi|veena|lekha|isha|priya|raveena|aditi|zira|aria|jenny|sonia|libby|hazel|susan|catherine|linda|samantha|karen|moira|tessa|fiona|victoria|allison|ava|emma|michelle|natasha|clara|google हिन्दी)/i;
const MALE = /(\bmale|madhur|prabhat|ravi|hemant|aarav|kunal|rehaan|rishi|david|mark|guy|ryan|george|james|richard|daniel|alex|fred|thomas|aaron|arthur|brian|eric|roger|christopher|andrew|william|liam|davis|tony)/i;

export const isNatural = (v) => NATURAL.test(v.name);
export function genderOf(v) {
  if (FEMALE.test(v.name)) return "female";
  if (MALE.test(v.name)) return "male";
  return null;
}
const langOf = (v) => v.lang.replace("_", "-").toLowerCase();
const isLang = (v, code) => langOf(v).startsWith(code);

export function voiceQuality() {
  if (!voices.length) return "none";
  const indian = voices.filter((v) => isLang(v, "hi") || isLang(v, "en-in"));
  if (indian.some(isNatural)) return "natural";
  return voices.some(isNatural) ? "good" : "basic";
}

// Ranked candidates for a gender + language, best first.
function ranked(gender, lang) {
  const score = (v) => {
    let s = 0;
    if (lang === "hi") {
      if (!isLang(v, "hi")) return -1;
    } else {
      if (!isLang(v, "en")) return -1;
      if (isLang(v, "en-in")) s += 40;
      else if (isLang(v, "en-gb")) s += 12;
    }
    const g = genderOf(v);
    if (g === gender) s += 30;
    else if (g) s -= 30;
    if (isNatural(v)) s += 50;
    if (/google/i.test(v.name)) s += 8;
    return s;
  };
  return voices
    .map((v) => [score(v), v])
    .filter(([s]) => s >= 0)
    .sort((a, b) => b[0] - a[0])
    .map(([, v]) => v);
}

/** Voice for a character. `slot` lets several characters of one gender get different voices. */
export function voiceFor({ gender, lang, slot = 0, override }) {
  const key = `${gender}|${lang}|${slot}|${override ?? ""}`;
  if (cache.has(key)) return cache.get(key);
  let v = override ? voices.find((x) => x.name === override) : null;
  if (!v) {
    const list = ranked(gender, lang);
    const sameGender = list.filter((x) => genderOf(x) === gender || !genderOf(x));
    const pool = sameGender.length ? sameGender : list;
    v = pool.length ? pool[slot % pool.length] : null;
  }
  cache.set(key, v);
  return v;
}

export function hostVoices() {
  return {
    hi: voiceFor({ gender: "male", lang: "hi", override: config.hostHi }),
    en: voiceFor({ gender: "male", lang: "en", override: config.hostEn }),
  };
}

const MOODS = {
  neutral: [1, 1],
  warm: [0.97, 1.01],
  calm: [0.95, 0.98],
  excited: [1.07, 1.1],
  tense: [0.9, 0.93],
  dramatic: [0.82, 0.88],
  sad: [0.9, 0.9],
  whisper: [0.92, 0.95],
};

let token = 0;
let ducking = 0;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

function utter(text, voice, rate, pitch, volume) {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    }
    u.rate = Math.min(1.8, Math.max(0.55, rate));
    u.pitch = Math.min(1.6, Math.max(0.5, pitch));
    u.volume = volume;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(guard);
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    const guard = setTimeout(finish, 2500 + (text.length * 95) / u.rate);
    synth.speak(u);
  });
}

// "Saat... crore!" → [{text:"Saat", pause:650}, {text:"crore!", pause:0}]
function phrases(text) {
  const out = [];
  for (const part of text.split(/(\.\.\.|…|\|)/)) {
    if (part === "..." || part === "…") {
      if (out.length) out[out.length - 1].pause = 480;
    } else if (part === "|") {
      if (out.length) out[out.length - 1].pause = 190;
    } else if (part.trim()) {
      out.push({ text: part.trim(), pause: 0 });
    }
  }
  return out;
}

// Recorded host clips (the Host Voice Pack), keyed by moment id. When a line's moment has a
// clip, the clip plays instead of the synthesised voice.
const clips = new Map();
let activeClip = null;

export function setClip(id, blob) {
  const old = clips.get(id);
  if (old) URL.revokeObjectURL(old);
  if (blob) clips.set(id, URL.createObjectURL(blob));
  else clips.delete(id);
}
export const hasClip = (id) => clips.has(id);

function stopClip() {
  activeClip?.stop();
  activeClip = null;
}

export async function playClip(id) {
  const url = clips.get(id);
  if (!url) return;
  token++;
  synth?.cancel();
  stopClip();
  const clip = audio.playUrl(url, 1);
  activeClip = clip;
  ducking++;
  audio.duck(0.2);
  try {
    await clip.done;
  } finally {
    if (activeClip === clip) activeClip = null;
    ducking = Math.max(0, ducking - 1);
    if (!ducking) audio.unduck();
  }
}

/**
 * Speak `text` with a voice. Interrupts anything already being said (unless queue: true).
 * Resolves when finished or cancelled; never rejects.
 */
export async function speak(text, { voice, mood = "neutral", rate = 1, pitch = 1, volume = 1, queue = false } = {}) {
  if (!synth || !text) return;
  if (!queue) {
    token++;
    synth.cancel();
    stopClip();
    await pause(40);
  }
  const mine = token;
  const [mr, mp] = MOODS[mood] ?? MOODS.neutral;
  ducking++;
  audio.duck(0.26);
  try {
    for (const p of phrases(text)) {
      if (mine !== token) return;
      await utter(p.text, voice, rate * mr * config.rate, pitch * mp, volume);
      if (mine !== token) return;
      if (p.pause) await pause(p.pause);
    }
  } finally {
    ducking = Math.max(0, ducking - 1);
    if (!ducking) audio.unduck();
  }
}

export function cancelSpeech() {
  token++;
  synth?.cancel();
  stopClip();
  ducking = 0;
  audio.unduck();
}

export const isSpeaking = () => !!synth?.speaking || !!activeClip;

// A Hindi voice is acceptable for a character if the player picked it explicitly, or if it isn't
// of the opposite gender (characters never switch gender just to speak Hindi).
function hindiVoiceFor(who) {
  const v = voiceFor({ gender: who.gender, lang: "hi", slot: who.slot ?? 0, override: who.overrideHi });
  if (!v || !isLang(v, "hi")) return null;
  const chosen = !!who.overrideHi && v.name === who.overrideHi;
  const opposite = who.gender === "male" ? "female" : "male";
  return chosen || genderOf(v) !== opposite ? v : null;
}

/**
 * Speak a script line as a character.
 * line: { id (moment), text (Hinglish, shown), hi (Devanagari, spoken by Hindi voices), en (English) }
 * who:  { gender, rate, pitch, slot, hindi (prefers Hindi delivery), isHost, overrideHi, overrideEn }
 */
export function speakLine(line, who, { language = "hinglish", mood, queue } = {}) {
  if (!line) return Promise.resolve();
  if (who.isHost && line.id && clips.has(line.id)) return playClip(line.id);
  const hiVoice = language !== "english" && who.hindi !== false && line.hi ? hindiVoiceFor(who) : null;
  const voice = hiVoice ?? voiceFor({ gender: who.gender, lang: "en", slot: who.slot ?? 0, override: who.overrideEn });
  const text = hiVoice ? line.hi : line.en ?? line.text;
  return speak(text, { voice, mood: mood ?? line.mood, rate: who.rate ?? 1, pitch: who.pitch ?? 1, queue });
}

/** Speak plain English text (questions, options, the expert's reasoning) as a character. */
export function speakEnglish(text, who, opts = {}) {
  let voice = voiceFor({ gender: who.gender, lang: "en", slot: who.slot ?? 0, override: who.overrideEn });
  // One consistent host: a natural (or hand-picked) Hindi voice also reads the English questions,
  // the way the show's host reads them with an Indian accent.
  if (who.isHost && config.oneVoice && !who.overrideEn) {
    const hi = hindiVoiceFor(who);
    if (hi && (isNatural(hi) || hi.name === who.overrideHi)) voice = hi;
  }
  return speak(text, { voice, rate: who.rate ?? 1, pitch: who.pitch ?? 1, ...opts });
}

// The host: a deep, unhurried baritone.
export const HOST = { gender: "male", rate: 0.98, pitch: 0.86, slot: 0 };
export const hostWho = () => ({ ...HOST, isHost: true, overrideHi: config.hostHi, overrideEn: config.hostEn });

export const isEdge = () => typeof navigator !== "undefined" && /Edg\//.test(navigator.userAgent);
