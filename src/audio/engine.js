import themeUrl from "../assets/audio/main-theme.mp3";
import letsPlayUrl from "../assets/audio/lets-play.mp3";
import bedEasyUrl from "../assets/audio/bed-easy.mp3";
import bedHardUrl from "../assets/audio/bed-hard.mp3";
import suspenseUrl from "../assets/audio/final-answer.mp3";
import correctUrl from "../assets/audio/correct.mp3";
import wrongUrl from "../assets/audio/wrong.mp3";
import winnerUrl from "../assets/audio/winner.mp3";
import timesUpUrl from "../assets/audio/times-up.mp3";
import fiftyUrl from "../assets/audio/fifty-fifty.mp3";
import phoneUrl from "../assets/audio/phone-a-friend.mp3";
import audienceUrl from "../assets/audio/ask-the-audience.mp3";
import outroUrl from "../assets/audio/back-to-menu.mp3";

// Recorded tracks. "music" tracks share the music bus (and get ducked under speech);
// "sfx" tracks are one-shot stings.
const TRACKS = {
  theme: { src: themeUrl, bus: "music", loop: true, volume: 0.85 },
  letsPlay: { src: letsPlayUrl, bus: "music", volume: 0.95 },
  bedEasy: { src: bedEasyUrl, bus: "music", loop: true, volume: 0.5 },
  bedHard: { src: bedHardUrl, bus: "music", loop: true, volume: 0.55 },
  suspense: { src: suspenseUrl, bus: "music", loop: true, volume: 0.85 },
  phone: { src: phoneUrl, bus: "music", volume: 0.42 },
  audience: { src: audienceUrl, bus: "music", volume: 0.5 },
  outro: { src: outroUrl, bus: "music", volume: 0.8 },
  correct: { src: correctUrl, bus: "sfx", volume: 0.9 },
  wrong: { src: wrongUrl, bus: "sfx", volume: 0.95 },
  winner: { src: winnerUrl, bus: "sfx", volume: 1 },
  timesUp: { src: timesUpUrl, bus: "sfx", volume: 0.9 },
  fifty: { src: fiftyUrl, bus: "sfx", volume: 0.95 },
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.tracks = new Map();
    this.current = null;
    this.volumes = { master: 0.9, music: 0.7, sfx: 0.9 };
  }

  ensure() {
    if (this.ctx) return this.ctx;
    const Ctx = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
    if (!Ctx) return null;
    const ctx = new Ctx({ latencyHint: "interactive" });
    this.ctx = ctx;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.knee.value = 10;
    comp.ratio.value = 3.5;
    comp.attack.value = 0.004;
    comp.release.value = 0.25;
    comp.connect(ctx.destination);

    this.master = ctx.createGain();
    this.master.connect(comp);
    this.duckGain = ctx.createGain();
    this.duckGain.connect(this.master);
    this.musicBus = ctx.createGain();
    this.musicBus.connect(this.duckGain);
    this.sfxBus = ctx.createGain();
    this.sfxBus.connect(this.master);
    this.applyVolumes();
    return ctx;
  }

  get ready() {
    return !!this.ctx && this.ctx.state === "running";
  }

  unlock() {
    const ctx = this.ensure();
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
  }

  applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const { master, music, sfx } = this.volumes;
    this.master.gain.setTargetAtTime(master, t, 0.04);
    this.musicBus.gain.setTargetAtTime(music, t, 0.04);
    this.sfxBus.gain.setTargetAtTime(sfx, t, 0.04);
  }

  setVolumes(v) {
    Object.assign(this.volumes, v);
    this.applyVolumes();
  }

  track(name) {
    const existing = this.tracks.get(name);
    if (existing) return existing;
    const def = TRACKS[name];
    if (!def || !this.ensure()) return null;
    const el = new Audio(def.src);
    el.preload = "auto";
    el.loop = !!def.loop;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    this.ctx.createMediaElementSource(el).connect(gain).connect(def.bus === "music" ? this.musicBus : this.sfxBus);
    const t = { name, def, el, gain, stopTimer: 0 };
    this.tracks.set(name, t);
    return t;
  }

  preload(names) {
    names.forEach((n) => this.track(n));
  }

  play(name, { volume, fade = 0, from = 0, loop } = {}) {
    const t = this.track(name);
    if (!t) return null;
    clearTimeout(t.stopTimer);
    const now = this.ctx.currentTime;
    const target = volume ?? t.def.volume ?? 1;
    const g = t.gain.gain;
    g.cancelScheduledValues(now);
    if (fade > 0) {
      g.setValueAtTime(t.el.paused ? 0 : g.value, now);
      g.linearRampToValueAtTime(target, now + fade);
    } else {
      g.setValueAtTime(target, now);
    }
    if (loop !== undefined) t.el.loop = loop;
    try {
      t.el.currentTime = from;
    } catch {
      /* not seekable yet */
    }
    t.el.play()?.catch(() => {});
    return t;
  }

  stop(name, fade = 0.25) {
    const t = this.tracks.get(name);
    if (!t || t.el.paused) return;
    const now = this.ctx.currentTime;
    const g = t.gain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + Math.max(0.01, fade));
    clearTimeout(t.stopTimer);
    t.stopTimer = setTimeout(() => t.el.pause(), fade * 1000 + 40);
  }

  // Crossfade to a music bed; a no-op if it's already the one playing.
  music(name, { fade = 0.8, fadeOut = 0.6, restart = false, ...opts } = {}) {
    if (!restart && this.current === name) {
      const t = this.tracks.get(name);
      if (t && !t.el.paused) return;
    }
    if (this.current && this.current !== name) this.stop(this.current, fadeOut);
    this.current = name;
    if (name) this.play(name, { fade, ...opts });
  }

  stopMusic(fade = 0.6) {
    if (this.current) this.stop(this.current, fade);
    this.current = null;
  }

  duck(level = 0.32, time = 0.25) {
    if (!this.ctx) return;
    this.duckGain.gain.setTargetAtTime(level, this.ctx.currentTime, time / 3);
  }

  unduck(time = 0.6) {
    if (!this.ctx) return;
    this.duckGain.gain.setTargetAtTime(1, this.ctx.currentTime, time / 3);
  }

  // Play an arbitrary audio URL (e.g. a recorded host clip) through the effects bus.
  playUrl(url, volume = 1) {
    if (!this.ensure()) return { done: Promise.resolve(), stop() {} };
    const el = new Audio(url);
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    const src = this.ctx.createMediaElementSource(el);
    src.connect(gain).connect(this.sfxBus);
    let resolve;
    const done = new Promise((r) => (resolve = r));
    const finish = () => {
      el.onended = el.onerror = null;
      try {
        src.disconnect();
      } catch {
        /* already disconnected */
      }
      resolve();
    };
    el.onended = finish;
    el.onerror = finish;
    el.play()?.catch(finish);
    return {
      done,
      stop: () => {
        el.pause();
        finish();
      },
    };
  }

  stopAll(fade = 0.3) {
    for (const name of this.tracks.keys()) this.stop(name, fade);
    this.current = null;
  }
}

export const audio = new AudioEngine();
