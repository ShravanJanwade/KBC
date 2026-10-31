// Thin wrapper over the Web Speech API: picks an Indian-English voice where available,
// ducks the music while speaking and resolves when the line finishes (or is cancelled).
import { audio } from "./engine";

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
export const speechSupported = !!synth;

let voices = [];
const refresh = () => {
  voices = synth?.getVoices() ?? [];
};
if (synth) {
  refresh();
  synth.addEventListener?.("voiceschanged", refresh);
}

const FEMALE = /(female|heera|neerja|swara|kalpana|veena|lekha|zira|aria|jenny|sonia|libby|hazel|susan|catherine|linda|samantha|karen|moira|tessa|fiona|victoria|allison|ava|emma|michelle|natasha|clara|joanna|kendra|raveena|aditi|isha|ananya|priya|aarohi)/i;
const MALE = /(\bmale|ravi|prabhat|hemant|madhur|rishi|david|mark|guy|ryan|george|james|richard|daniel|alex|fred|thomas|aaron|arthur|brian|eric|roger|christopher|andrew|kunal|aarav)/i;
const PREMIUM = /(natural|neural|online|enhanced|premium)/i;

function genderOf(v) {
  if (FEMALE.test(v.name)) return "female";
  if (MALE.test(v.name)) return "male";
  return null;
}

export function pickVoice(gender) {
  if (!voices.length) refresh();
  const english = voices.filter((v) => /^en[-_]/i.test(v.lang) || /^en$/i.test(v.lang));
  const byLang = (prefix) => english.filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith(prefix));
  for (const lang of ["en-in", "en-gb", "en-us", "en"]) {
    const list = byLang(lang);
    if (!list.length) continue;
    const ranked = [...list].sort((a, b) => Number(PREMIUM.test(b.name)) - Number(PREMIUM.test(a.name)));
    const match = gender ? ranked.find((v) => genderOf(v) === gender) : null;
    if (match) return { voice: match, exact: true };
    if (lang === "en-in" && !gender) return { voice: ranked[0], exact: true };
  }
  const any = english[0] ?? voices[0];
  return any ? { voice: any, exact: false } : null;
}

let speaking = 0;

export function say(text, { gender, rate = 1, pitch = 1, volume = 1, duck = true } = {}) {
  if (!synth || !text) return Promise.resolve();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    const picked = pickVoice(gender);
    if (picked) {
      u.voice = picked.voice;
      u.lang = picked.voice.lang;
      // No voice of the requested gender installed: nudge the pitch instead.
      if (!picked.exact && gender) pitch *= gender === "female" ? 1.18 : 0.86;
    }
    u.rate = rate;
    u.pitch = pitch;
    u.volume = volume;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      speaking = Math.max(0, speaking - 1);
      if (duck && !speaking) audio.unduck();
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    if (duck) audio.duck(0.3);
    speaking++;
    synth.speak(u);
    // Safety net: some engines never fire onend.
    setTimeout(finish, 1500 + text.length * 110);
  });
}

export function cancelSpeech() {
  if (!synth) return;
  synth.cancel();
  speaking = 0;
  audio.unduck();
}
