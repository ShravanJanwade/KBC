// Synthesised sound effects (Web Audio). Everything routes through the engine's sfx bus,
// so the SFX volume slider and master compressor apply.
import { audio } from "./engine";

let noiseBuffer = null;
const ctx = () => audio.ensure();
const now = () => ctx()?.currentTime ?? 0;

function getNoise(c) {
  if (noiseBuffer) return noiseBuffer;
  const len = c.sampleRate * 2;
  noiseBuffer = c.createBuffer(1, len, c.sampleRate);
  const d = noiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

// Attack → (optional hold) → exponential release over `dur`. Total length = attack + hold + dur.
function envelope(param, t, { gain, attack, dur, hold = 0 }) {
  const peak = Math.max(0.0002, gain);
  param.setValueAtTime(0.0001, t);
  param.exponentialRampToValueAtTime(peak, t + attack);
  if (hold > 0) param.setValueAtTime(peak, t + attack + hold);
  param.exponentialRampToValueAtTime(0.0001, t + attack + hold + Math.max(0.01, dur));
}

function tone({ type = "sine", freq = 440, freqEnd, t, dur = 0.2, gain = 0.2, attack = 0.005, hold = 0, detune = 0, dest, filter }) {
  const c = ctx();
  if (!c) return;
  t = t ?? c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + attack + hold + dur);
  o.detune.value = detune;
  envelope(g.gain, t, { gain, attack, dur, hold });
  let node = o;
  if (filter) {
    const f = c.createBiquadFilter();
    f.type = filter.type || "lowpass";
    f.frequency.setValueAtTime(filter.freq, t);
    if (filter.freqEnd) f.frequency.exponentialRampToValueAtTime(filter.freqEnd, t + attack + hold + dur);
    f.Q.value = filter.q ?? 0.7;
    node.connect(f);
    node = f;
  }
  node.connect(g).connect(dest || audio.sfxBus);
  o.start(t);
  o.stop(t + attack + hold + dur + 0.05);
}

function noise({ t, dur = 0.2, gain = 0.2, attack = 0.005, hold = 0, filter = "bandpass", freq = 1000, freqEnd, q = 1, dest }) {
  const c = ctx();
  if (!c) return;
  t = t ?? c.currentTime;
  const s = c.createBufferSource();
  s.buffer = getNoise(c);
  s.loop = true;
  const f = c.createBiquadFilter();
  f.type = filter;
  f.frequency.setValueAtTime(freq, t);
  if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + attack + hold + dur);
  f.Q.value = q;
  const g = c.createGain();
  envelope(g.gain, t, { gain, attack, dur, hold });
  s.connect(f).connect(g).connect(dest || audio.sfxBus);
  s.start(t, Math.random() * 1.5);
  s.stop(t + attack + hold + dur + 0.05);
}

function beat(t, g) {
  tone({ freq: 82, freqEnd: 36, dur: 0.24, gain: g, t, attack: 0.006 });
  noise({ t, dur: 0.09, gain: g * 0.22, filter: "lowpass", freq: 160, q: 0.5 });
}

const DTMF = {
  1: [697, 1209], 2: [697, 1336], 3: [697, 1477],
  4: [770, 1209], 5: [770, 1336], 6: [770, 1477],
  7: [852, 1209], 8: [852, 1336], 9: [852, 1477],
  "*": [941, 1209], 0: [941, 1336], "#": [941, 1477],
};

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

export const sfx = {
  hover() {
    tone({ freq: 2500, dur: 0.035, gain: 0.025 });
  },
  click() {
    tone({ type: "triangle", freq: 920, freqEnd: 620, dur: 0.07, gain: 0.13 });
  },
  back() {
    tone({ type: "triangle", freq: 720, freqEnd: 400, dur: 0.1, gain: 0.11 });
  },
  tick() {
    const t = now();
    tone({ freq: 1250, freqEnd: 820, dur: 0.08, gain: 0.2, t });
    noise({ t, dur: 0.025, gain: 0.06, filter: "highpass", freq: 5200 });
  },
  clockTick(high = true) {
    const t = now();
    noise({ t, dur: 0.018, gain: 0.07, filter: "bandpass", freq: high ? 3400 : 2600, q: 4 });
    tone({ freq: high ? 1600 : 1300, dur: 0.02, gain: 0.025, t });
  },
  warnBeep() {
    tone({ type: "square", freq: 880, dur: 0.12, gain: 0.06, filter: { freq: 2200 } });
  },
  select() {
    const t = now();
    tone({ freq: 660, dur: 0.08, gain: 0.13, t });
    tone({ freq: 990, dur: 0.14, gain: 0.11, t: t + 0.07 });
  },
  lock() {
    const t = now();
    tone({ freq: 160, freqEnd: 40, dur: 0.65, gain: 0.85, t, attack: 0.004 });
    noise({ t, dur: 0.2, gain: 0.22, filter: "lowpass", freq: 900 });
    tone({ type: "square", freq: 1900, dur: 0.05, gain: 0.03, t, filter: { freq: 4000 } });
  },
  heartbeat(intensity = 1) {
    const t = now();
    beat(t, 0.9 * intensity);
    beat(t + 0.23, 0.62 * intensity);
  },
  whoosh(dir = "up", dur = 0.55) {
    noise({ dur, gain: 0.16, attack: dur * 0.5, filter: "bandpass", freq: dir === "up" ? 320 : 4200, freqEnd: dir === "up" ? 4800 : 280, q: 0.9 });
  },
  reveal() {
    this.whoosh("up", 0.45);
    const t = now() + 0.12;
    [1046.5, 1318.5, 1568, 2093].forEach((f, i) =>
      tone({ freq: f, dur: 1.5, gain: 0.045, t: t + i * 0.035, attack: 0.01, detune: (Math.random() - 0.5) * 10 })
    );
    tone({ freq: 130.8, dur: 1.3, gain: 0.12, t, attack: 0.18 });
  },
  optionIn() {
    const t = now();
    tone({ freq: 520, freqEnd: 780, dur: 0.12, gain: 0.08, t, attack: 0.01 });
    noise({ t, dur: 0.06, gain: 0.03, filter: "highpass", freq: 4000 });
  },
  coin() {
    const t = now();
    tone({ type: "square", freq: 987.8, dur: 0.08, gain: 0.06, t, filter: { freq: 3500 } });
    tone({ type: "square", freq: 1318.5, dur: 0.4, gain: 0.06, t: t + 0.075, filter: { freq: 3500 } });
  },
  ding() {
    const t = now();
    tone({ freq: 1318.5, dur: 0.9, gain: 0.08, t });
    tone({ freq: 1760, dur: 1.1, gain: 0.06, t: t + 0.09 });
    tone({ freq: 2637, dur: 0.6, gain: 0.02, t: t + 0.09 });
  },
  sparkle(n = 10, spread = 0.7) {
    const t = now();
    for (let i = 0; i < n; i++) {
      tone({ freq: 1800 + Math.random() * 3600, dur: 0.12 + Math.random() * 0.12, gain: 0.03, t: t + Math.random() * spread, attack: 0.003 });
    }
  },
  ladderUp() {
    const t = now();
    tone({ freq: 440, freqEnd: 1320, dur: 0.18, gain: 0.08, t, attack: 0.01 });
    this.sparkle(6, 0.35);
  },
  boom() {
    const t = now();
    tone({ freq: 70, freqEnd: 30, dur: 1.5, gain: 0.95, t, attack: 0.01 });
    noise({ t, dur: 0.6, gain: 0.3, filter: "lowpass", freq: 140 });
  },
  cymbal(t = now(), gain = 0.22) {
    noise({ t, dur: 2.2, gain, attack: 0.004, filter: "highpass", freq: 5200, q: 0.4 });
    noise({ t, dur: 1.2, gain: gain * 0.5, attack: 0.004, filter: "bandpass", freq: 8000, q: 0.8 });
  },
  gong() {
    const t = now();
    [[110, 1], [228, 0.6], [353, 0.45], [497, 0.3], [712, 0.2], [1043, 0.1]].forEach(([f, g]) =>
      tone({ freq: f, dur: 3.2, gain: 0.16 * g, t, attack: 0.01, detune: (Math.random() - 0.5) * 12 })
    );
    noise({ t, dur: 0.3, gain: 0.08, filter: "bandpass", freq: 600, q: 1 });
    this.sparkle(14, 1.4);
  },
  fanfare() {
    const t = now();
    [60, 64, 67, 72].forEach((n, i) => {
      [-7, 7].forEach((det) =>
        tone({ type: "sawtooth", freq: NOTE(n), dur: 1.4 - i * 0.12, gain: 0.05, t: t + i * 0.1, attack: 0.02, detune: det, filter: { freq: 2600, freqEnd: 900 } })
      );
    });
    [48, 55].forEach((n) => tone({ type: "triangle", freq: NOTE(n), dur: 1.6, gain: 0.08, t: t + 0.3, attack: 0.04 }));
    this.cymbal(t + 0.3, 0.12);
  },
  riser(dur = 1.6) {
    const t = now();
    noise({ t, dur: 0.08, gain: 0.14, attack: dur, filter: "bandpass", freq: 300, freqEnd: 6000, q: 1.4 });
    tone({ type: "sawtooth", freq: 110, freqEnd: 440, dur: 0.08, gain: 0.05, t, attack: dur, filter: { freq: 1200 } });
  },
  drumroll(dur = 2.2) {
    const t0 = now();
    const hits = Math.floor(dur / 0.045);
    for (let i = 0; i < hits; i++) {
      const p = i / hits;
      noise({ t: t0 + i * 0.045 + Math.random() * 0.008, dur: 0.06, gain: 0.03 + p * 0.16, attack: 0.002, filter: "bandpass", freq: 1800 + Math.random() * 600, q: 0.9 });
    }
  },
  buzzer() {
    const t = now();
    [110, 116.5].forEach((f) => tone({ type: "sawtooth", freq: f, dur: 0.7, gain: 0.12, t, attack: 0.01, hold: 0.25, filter: { freq: 900 } }));
  },
  error() {
    const t = now();
    tone({ type: "triangle", freq: 330, dur: 0.12, gain: 0.12, t });
    tone({ type: "triangle", freq: 220, dur: 0.2, gain: 0.12, t: t + 0.12 });
  },
  keypad() {
    const t = now();
    tone({ freq: 1150, dur: 0.07, gain: 0.1, t });
    noise({ t, dur: 0.015, gain: 0.05, filter: "highpass", freq: 3000 });
  },
  dtmf(digit, t = now()) {
    const [a, b] = DTMF[digit] ?? DTMF[0];
    tone({ freq: a, dur: 0.06, gain: 0.06, t, attack: 0.004, hold: 0.06 });
    tone({ freq: b, dur: 0.06, gain: 0.06, t, attack: 0.004, hold: 0.06 });
  },
  pickup() {
    const t = now();
    noise({ t, dur: 0.05, gain: 0.12, filter: "bandpass", freq: 1500, q: 2 });
    tone({ freq: 880, dur: 0.08, gain: 0.05, t: t + 0.04 });
  },
  hangup() {
    const t = now();
    for (let i = 0; i < 3; i++) tone({ freq: 425, dur: 0.05, gain: 0.08, t: t + i * 0.32, attack: 0.005, hold: 0.16 });
  },
  // Indian ring-back tone: 400 Hz amplitude-modulated at 25 Hz, 0.4 on / 0.2 off / 0.4 on / 2.0 off.
  ringback() {
    const c = ctx();
    if (!c) return () => {};
    const t0 = c.currentTime + 0.05;
    const carrier = c.createOscillator();
    carrier.frequency.value = 400;
    const am = c.createGain();
    am.gain.value = 0.5;
    const lfo = c.createOscillator();
    lfo.frequency.value = 25;
    const depth = c.createGain();
    depth.gain.value = 0.5;
    lfo.connect(depth).connect(am.gain);
    const cad = c.createGain();
    cad.gain.value = 0;
    carrier.connect(am).connect(cad).connect(audio.sfxBus);
    for (let k = 0; k < 12; k++) {
      const s = t0 + k * 3;
      cad.gain.setTargetAtTime(0.08, s, 0.006);
      cad.gain.setTargetAtTime(0, s + 0.4, 0.006);
      cad.gain.setTargetAtTime(0.08, s + 0.6, 0.006);
      cad.gain.setTargetAtTime(0, s + 1.0, 0.006);
    }
    carrier.start(t0);
    lfo.start(t0);
    return () => {
      const n = c.currentTime;
      cad.gain.cancelScheduledValues(n);
      cad.gain.setTargetAtTime(0, n, 0.01);
      carrier.stop(n + 0.08);
      lfo.stop(n + 0.08);
    };
  },
  // Faint telephone-line hiss with the odd crackle while a call is connected. Returns a stop function.
  phoneLine() {
    const c = ctx();
    if (!c) return () => {};
    const t0 = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = getNoise(c);
    src.loop = true;
    const band = c.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 1700;
    band.Q.value = 0.7;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.011, t0 + 0.5);
    src.connect(band).connect(g).connect(audio.sfxBus);
    src.start(t0);
    const crackle = setInterval(() => {
      if (Math.random() < 0.35) noise({ dur: 0.03 + Math.random() * 0.05, gain: 0.015 + Math.random() * 0.03, attack: 0.002, filter: "bandpass", freq: 1200 + Math.random() * 2500, q: 3 });
    }, 650);
    return () => {
      clearInterval(crackle);
      const n = c.currentTime;
      g.gain.cancelScheduledValues(n);
      g.gain.setTargetAtTime(0.0001, n, 0.05);
      src.stop(n + 0.4);
    };
  },
  // The bright two-note "payment received" chime of a UPI app.
  upiSuccess() {
    const t = now();
    [[1318.5, 0], [1975.5, 0.13]].forEach(([f, dt]) => {
      tone({ freq: f, dur: 1.1, gain: 0.11, t: t + dt, attack: 0.004 });
      tone({ freq: f * 2, dur: 0.5, gain: 0.025, t: t + dt, attack: 0.004 });
    });
    this.sparkle(8, 0.6);
  },
  notify() {
    const t = now();
    tone({ freq: 880, dur: 0.18, gain: 0.07, t });
    tone({ freq: 1174.7, dur: 0.3, gain: 0.07, t: t + 0.09 });
  },
  applause(dur = 3.5, level = 1) {
    const c = ctx();
    if (!c) return;
    const t0 = c.currentTime;
    const bus = c.createGain();
    bus.gain.setValueAtTime(0.0001, t0);
    bus.gain.exponentialRampToValueAtTime(level, t0 + 0.4);
    bus.gain.setValueAtTime(level, t0 + Math.max(0.5, dur - 1));
    bus.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    bus.connect(audio.sfxBus);
    const claps = Math.floor(dur * 75);
    for (let i = 0; i < claps; i++) {
      noise({
        t: t0 + Math.random() * dur,
        dur: 0.018 + Math.random() * 0.03,
        gain: 0.025 + Math.random() * 0.07,
        attack: 0.001,
        filter: "bandpass",
        freq: 700 + Math.random() * 2000,
        q: 1.1,
        dest: bus,
      });
    }
    noise({ t: t0, dur: 0.5, gain: 0.05, attack: 0.3, hold: Math.max(0.05, dur - 0.8), filter: "lowpass", freq: 2400, q: 0.3, dest: bus });
  },
};

// Looping "dhak-dhak" heartbeat for suspense moments.
let heartbeatTimer = 0;
export function startHeartbeat(bpm = 72, intensity = 1) {
  stopHeartbeat();
  sfx.heartbeat(intensity);
  heartbeatTimer = setInterval(() => sfx.heartbeat(intensity), 60000 / bpm);
}
export function stopHeartbeat() {
  clearInterval(heartbeatTimer);
  heartbeatTimer = 0;
}
