import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, LogOut, ListOrdered, SkipForward, X, Clock3 } from "lucide-react";
import Logo from "../../components/Logo";
import Avatar from "../../components/Avatar";
import { Button, AnimatedMoney } from "../../components/ui";
import { CategoryIcon } from "../../components/icons";
import { useStage } from "../../components/Stage";
import QuestionBoard from "./QuestionBoard";
import MoneyLadder from "./MoneyLadder";
import LifelineBar from "./LifelineBar";
import Timer from "./Timer";
import HostBanner from "./HostBanner";
import AudiencePoll from "./AudiencePoll";
import PhoneAFriend from "./PhoneAFriend";
import AskExpert from "./AskExpert";
import { MilestoneOverlay, BigWinOverlay, JackpotDialog, QuitDialog, PauseDialog, HintsDock, RevealPanel, ConfirmBar, GuessBar } from "./Overlays";
import { useApp } from "../../state/AppContext";
import { useSequencer } from "../../hooks/useSequencer";
import { QUESTIONS } from "../../data/questions";
import { CATEGORY_BY_ID } from "../../data/categories";
import { amountFor, safeAmount, timeLimitFor, suspenseMs, TOTAL_LEVELS, FLIP_UNLOCK_AFTER } from "../../data/prizes";
import { host } from "../../data/host";
import { ACHIEVEMENTS } from "../../data/achievements";
import { pickQuestion, prepareQuestion } from "../../engine/selector";
import { fiftyFifty } from "../../engine/lifelines";
import { updateRating, iqOf } from "../../engine/rating";
import { audio } from "../../audio/engine";
import { sfx, startHeartbeat, stopHeartbeat } from "../../audio/synth";
import { speakLine, speakEnglish, cancelSpeech, hostWho, speechSupported } from "../../audio/speech";
import { LETTERS, formatINR, shortINR } from "../../lib/format";
import { uid } from "../../lib/random";
import "../../styles/hotseat.css";
import "../../styles/lifelines.css";

const ANSWERING = new Set(["answer", "confirm"]);
const bedFor = (level) => (level <= 7 ? "bedEasy" : "bedHard");

export default function HotSeat({ fff, onFinish }) {
  const { profile, settings, updateSettings, seen, markSeen, recordGame, updateProfile, history } = useApp();
  const { setMood, flash } = useStage();
  const { run, cancel } = useSequencer();

  const [level, setLevel] = useState(1);
  const [q, setQ] = useState(null);
  const [phase, setPhase] = useState("intro");
  const [introStep, setIntroStep] = useState(0);
  const [qVisible, setQVisible] = useState(false);
  const [shown, setShown] = useState(0);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(null);
  const [removed, setRemoved] = useState([]);
  const [lifelines, setLifelines] = useState({ fifty: "ready", poll: "ready", phone: "ready", expert: "ready", flip: "locked" });
  const [hints, setHints] = useState([]);
  const [overlay, setOverlay] = useState(null);
  const [line, setLine] = useState(null);
  const [flashAnswer, setFlashAnswer] = useState(false);
  const [guess, setGuess] = useState(null);
  const [panel, setPanel] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [ladderOpen, setLadderOpen] = useState(false);
  const [timeLimit, setTimeLimit] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [endOutcome, setEndOutcome] = useState(null);

  // Mutable game data that async sequences read without stale closures.
  const game = useRef(null);
  if (!game.current) {
    game.current = {
      id: uid(),
      startedAt: Date.now(),
      records: [],
      used: new Set(),
      recent: [],
      rating: profile.rating,
      ratingBefore: profile.rating,
      mood: 0,
      fastStreak: 0,
      qLifelines: [],
      lifelinesUsed: {},
      phoneSuggestion: null,
      guessCorrect: null,
      finished: false,
      clock: { start: 0, paused: 0, pausedAt: 0 },
    };
  }
  const timer = useRef({ running: false, deadline: 0, remaining: 0, lastWhole: null });
  const live = useRef({});
  live.current = { level, q, phase, removed, lifelines, selected, timeLimit, settings, panel, endOutcome, overlay };
  // ---------- answer clock (excludes time spent inside lifelines) ----------
  const clockStart = () => (game.current.clock = { start: performance.now(), paused: 0, pausedAt: 0 });
  const clockPause = () => {
    const c = game.current.clock;
    if (!c.pausedAt) c.pausedAt = performance.now();
  };
  const clockResume = () => {
    const c = game.current.clock;
    if (c.pausedAt) {
      c.paused += performance.now() - c.pausedAt;
      c.pausedAt = 0;
    }
  };
  const clockElapsed = () => {
    const c = game.current.clock;
    return Math.max(0, (c.pausedAt || performance.now()) - c.start - c.paused);
  };

  // ---------- question timer ----------
  const startTimer = (secs) => {
    timer.current = { running: true, deadline: performance.now() + secs * 1000, remaining: secs * 1000, lastWhole: Math.ceil(secs) };
    setTimeLeft(secs);
    setTimerRunning(true);
  };
  const timeLeftNow = () => {
    const t = timer.current;
    return (t.running ? Math.max(0, t.deadline - performance.now()) : t.remaining) / 1000;
  };
  const pauseTimer = () => {
    const t = timer.current;
    if (!t.running) return;
    t.remaining = Math.max(0, t.deadline - performance.now());
    t.running = false;
    setTimerRunning(false);
    stopHeartbeat();
  };
  const resumeTimer = () => {
    const t = timer.current;
    if (t.running || !(t.remaining > 0)) return;
    t.deadline = performance.now() + t.remaining;
    t.running = true;
    setTimerRunning(true);
    if (t.remaining <= 10000) startHeartbeat(100, 0.75);
  };
  const stopTimer = () => {
    timer.current = { ...timer.current, running: false, remaining: 0 };
    setTimerRunning(false);
    stopHeartbeat();
  };

  // Show a host line in the lower third and, with narration on, speak it. Resolves when the host
  // has finished, so sequences can wait for him (resolves at once when narration is off).
  const hostSay = (l, mood) => {
    if (!l) return Promise.resolve();
    setLine({ ...l, key: Math.random() });
    const s = live.current.settings;
    if (!s.hostVoice) return Promise.resolve();
    return speakLine(l, hostWho(), { language: s.language, mood });
  };
  const voiceOn = () => !!live.current.settings.hostVoice && speechSupported;

  const handlers = useRef({});

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => {
      const t = timer.current;
      if (!t.running) return;
      const left = Math.max(0, (t.deadline - performance.now()) / 1000);
      setTimeLeft(left);
      const whole = Math.ceil(left);
      if (whole !== t.lastWhole) {
        t.lastWhole = whole;
        if (whole > 0 && whole <= 10) {
          sfx.clockTick(whole % 2 === 0);
          if (whole === 10) {
            startHeartbeat(100, 0.75);
            setMood("tense");
            if (live.current.phase === "answer" && !live.current.overlay) hostSay(host.clockLow());
          }
          if (whole <= 5) sfx.warnBeep();
        }
      }
      if (left <= 0) {
        t.running = false;
        setTimerRunning(false);
        handlers.current.timeout();
      }
    }, 100);
    return () => clearInterval(id);
  }, [timerRunning, setMood]);

  // ---------- bookkeeping ----------
  const recordQuestion = (extra) => {
    const { q: cur, level: lvl } = live.current;
    const g = game.current;
    const rec = {
      id: cur.id,
      c: cur.c,
      d: cur.d,
      level: lvl,
      q: cur.q,
      options: cur.options,
      answer: cur.answer,
      chosen: null,
      correct: null,
      timeMs: Math.round(clockElapsed()),
      timeLeft: null,
      lifelines: [...g.qLifelines],
      phoneSuggested: g.phoneSuggestion,
      timedOut: false,
      walked: false,
      guess: null,
      flipped: false,
      ...extra,
    };
    g.records.push(rec);
    return rec;
  };

  const applyRating = (correct, opts = {}) => {
    const g = game.current;
    const { q: cur } = live.current;
    g.rating = updateRating(g.rating, { catId: cur.c, d: cur.d, correct, assisted: g.qLifelines.length > 0, ...opts });
  };

  // ---------- flow ----------
  // Narration can always be skipped: pressing an answer key, Space/Enter or "Skip" during the
  // host's reading fast-forwards to the answering phase.
  const skip = useRef(false);
  const skipNarration = () => {
    if (!["announce", "reveal"].includes(live.current.phase)) return;
    skip.current = true;
    cancelSpeech();
  };

  const beginQuestion = (lvl, { flip = false } = {}) => {
    const g = game.current;
    const s = live.current.settings;
    const raw = pickQuestion({
      bank: QUESTIONS,
      level: lvl,
      rating: g.rating,
      mode: s.difficulty,
      relevance: profile.relevance,
      used: g.used,
      seen,
      recent: g.recent,
      mood: g.mood,
      avoidCat: flip ? live.current.q?.c : undefined,
    });
    if (!raw) return finish("walked");
    g.used.add(raw.id);
    g.recent.push(raw.c);
    g.qLifelines = [];
    g.phoneSuggestion = null;
    markSeen([raw.id]);
    const pq = prepareQuestion(raw);
    const limit = timeLimitFor(lvl, s.timerMode);

    setQ(pq);
    setLevel(lvl);
    setShown(0);
    setQVisible(false);
    setSelected(null);
    setLocked(null);
    setRemoved([]);
    setHints([]);
    setGuess(null);
    setFlashAnswer(false);
    setPanel(false);
    setEndOutcome(null);
    setTimeLimit(limit);
    setTimeLeft(limit ?? 0);
    timer.current = { running: false, deadline: 0, remaining: 0, lastWhole: null };
    setPhase("announce");
    setMood(lvl >= 15 ? "dark" : "calm");
    audio.music(bedFor(lvl), { fade: 1 });

    skip.current = false;
    run(async (wait, alive) => {
      const voice = voiceOn();
      if (!flip) {
        sfx.ladderUp();
        const intro = hostSay(host.questionIntro(lvl, amountFor(lvl), profile.name));
        await Promise.all([voice ? intro : null, wait(lvl >= 15 ? 700 : 1300)]);
        if (lvl >= 15 && !skip.current) {
          audio.stopMusic(0.5);
          sfx.drumroll(2.4);
          await wait(2400);
          sfx.boom();
          sfx.cymbal();
          flash("white");
          audio.music("bedHard", { fade: 1.5 });
          await wait(500);
        }
      } else {
        await Promise.all([voice ? hostSay(host.lifeline.flip()) : null, wait(300)]);
      }
      if (!alive()) return;
      setPhase("reveal");
      setQVisible(true);
      sfx.reveal();
      if (voice && !skip.current) {
        await wait(420);
        await speakEnglish(pq.q, hostWho(), { mood: lvl >= 11 ? "tense" : "calm" });
      } else {
        await wait(skip.current ? 150 : 1150);
      }
      for (let i = 1; i <= 4; i++) {
        if (!alive()) return;
        setShown(i);
        sfx.optionIn();
        if (skip.current) continue;
        if (voice) {
          await speakEnglish(`${LETTERS[i - 1]}| ${pq.options[i - 1]}`, hostWho(), { mood: "calm" });
          await wait(110);
        } else {
          await wait(lvl >= 15 ? 650 : 420);
        }
      }
      if (!alive()) return;
      if (limit && voice && !skip.current && (lvl === 1 || lvl === 6 || Math.random() < 0.3)) await hostSay(host.startClock());
      if (!alive()) return;
      setPhase("answer");
      clockStart();
      if (limit) startTimer(limit);
    });
  };

  const pickOption = (i) => {
    const { phase: ph, removed: rem, selected: sel, level: lvl } = live.current;
    if (ph === "announce" || ph === "reveal") return skipNarration();
    if (!ANSWERING.has(ph) || rem.includes(i) || live.current.overlay) return;
    if (!live.current.settings.confirmLock || (ph === "confirm" && sel === i)) return lockAnswer(i);
    sfx.select();
    setSelected(i);
    setPhase("confirm");
    const confirmLine = () => live.current.phase === "confirm" && live.current.selected === i && hostSay(host.confirm(LETTERS[i]));
    const quick = sel == null && lvl >= 4 && clockElapsed() < 2500;
    if (voiceOn() && sel != null && sel !== i && Math.random() < 0.5) hostSay(host.changed()).then(confirmLine);
    else if (voiceOn() && quick && Math.random() < 0.6) hostSay(host.quickPick()).then(confirmLine);
    else hostSay(host.confirm(LETTERS[i]));
  };

  const cancelSelection = () => {
    if (live.current.phase !== "confirm") return;
    sfx.back();
    setSelected(null);
    setPhase("answer");
  };

  const lockAnswer = (i) => {
    const { phase: ph, q: cur, level: lvl, timeLimit: limit } = live.current;
    if (!ANSWERING.has(ph) || i == null) return;
    const g = game.current;
    const leftSecs = limit ? timeLeftNow() : null;
    stopTimer();
    clockPause();
    setSelected(null);
    setLocked(i);
    setPhase("locked");
    sfx.lock();
    const lockLine = hostSay(host.locked(LETTERS[i]));
    audio.music("suspense", { fade: 0.35, fadeOut: 0.3 });
    setMood("suspense");
    startHeartbeat(lvl >= 11 ? 64 : 78, lvl >= 11 ? 1 : 0.75);
    const correct = i === cur.answer;
    const timeMs = Math.round(clockElapsed());

    run(async (wait, alive) => {
      const t0 = performance.now();
      const ms = suspenseMs(lvl) + Math.random() * (lvl >= 11 ? 1400 : 500);
      if (voiceOn()) {
        await lockLine;
        if (!alive()) return;
        if (lvl >= 8) await hostSay(host.suspense(), "whisper");
        if (!alive()) return;
      }
      const left = Math.max(lvl >= 13 ? 1700 : 350, ms - (performance.now() - t0));
      if (lvl >= 13) {
        await wait(left - 1600);
        sfx.riser(1.5);
        await wait(1600);
      } else {
        await wait(left);
      }
      stopHeartbeat();
      audio.stopMusic(0.12);
      const fast = correct && (limit ? timeMs < limit * 300 : timeMs < 9000);
      recordQuestion({ chosen: i, correct, timeMs, timeLeft: leftSecs != null ? Math.round(leftSecs * 10) / 10 : null });
      applyRating(correct, { fast });
      if (correct) {
        g.fastStreak = fast && !g.qLifelines.length ? g.fastStreak + 1 : 0;
        g.mood = g.qLifelines.length || (leftSecs != null && leftSecs < 6) ? 0.05 : g.fastStreak >= 3 ? -0.04 : 0;
        revealCorrect(lvl, i);
      } else {
        revealWrong(lvl);
      }
    });
  };

  const revealCorrect = (lvl, chosen) => {
    const g = game.current;
    setPhase("correct");
    audio.play("correct");
    flash("correct");
    setMood("correct");
    sfx.sparkle(12, 0.8);
    const friend = g.phoneSuggestion === chosen ? g.phoneFriend : null;
    const said = hostSay(host.correct(lvl, amountFor(lvl), { lifeline: g.qLifelines.length > 0, friend, streak: g.fastStreak }));
    run(async (wait, alive) => {
      await Promise.all([voiceOn() ? said : null, wait(1500)]);
      if (!alive()) return;
      if (lvl === TOTAL_LEVELS) {
        setMood("celebrate");
        hostSay(host.jackpot());
        return setOverlay("jackpot");
      }
      if (lvl === 15) {
        setMood("celebrate");
        hostSay(host.crore());
        return setOverlay("crore");
      }
      if (lvl === 5 || lvl === 10) {
        setMood("celebrate");
        hostSay(host.milestone(lvl));
        return setOverlay("milestone");
      }
      setPanel(true);
    });
  };

  const revealWrong = (lvl) => {
    setPhase("wrong");
    audio.play("wrong");
    flash("wrong");
    setMood("wrong");
    setEndOutcome("wrong");
    const said = hostSay(host.wrong(LETTERS[live.current.q.answer], safeAmount(lvl)));
    run(async (wait, alive) => {
      await wait(800);
      setFlashAnswer(true);
      await Promise.all([voiceOn() ? said : null, wait(1800)]);
      if (!alive()) return;
      setPanel(true);
    });
  };

  handlers.current.timeout = () => {
    const { phase: ph } = live.current;
    if (!ANSWERING.has(ph)) return;
    stopTimer();
    clockPause();
    setSelected(null);
    setPhase("timeout");
    audio.stopMusic(0.2);
    audio.play("timesUp");
    flash("wrong");
    setMood("wrong");
    const banked = game.current.records.filter((r) => r.correct).length;
    const said = hostSay(host.timeUp(amountFor(banked)));
    recordQuestion({ timedOut: true, timeLeft: 0 });
    applyRating(false, { timedOut: true });
    setEndOutcome("timeout");
    run(async (wait, alive) => {
      await wait(900);
      setFlashAnswer(true);
      await Promise.all([voiceOn() ? said : null, wait(1600)]);
      if (!alive()) return;
      setPanel(true);
    });
  };

  // ---------- walking away ----------
  const openQuit = () => {
    if (!ANSWERING.has(live.current.phase)) return;
    pauseTimer();
    clockPause();
    setOverlay("quit");
    hostSay(host.quitAsk(amountFor(game.current.records.filter((r) => r.correct).length)));
  };
  const cancelQuit = () => {
    setOverlay(null);
    resumeTimer();
    clockResume();
  };
  const confirmQuit = () => {
    setOverlay(null);
    stopTimer();
    setSelected(null);
    setPhase("guess");
    setMood("calm");
    hostSay(host.quitGuess());
  };
  const guessAnswer = (i) => {
    const { phase: ph, q: cur, removed: rem } = live.current;
    if (ph !== "guess" || rem.includes(i)) return;
    const right = i === cur.answer;
    game.current.guessCorrect = right;
    setGuess(i);
    setPhase("guessed");
    sfx.lock();
    recordQuestion({ walked: true, guess: i });
    setEndOutcome("walked");
    run(async (wait, alive) => {
      await wait(1700);
      audio.stopMusic(0.4);
      setPhase("walked");
      setFlashAnswer(true);
      if (right) sfx.ding();
      else sfx.error();
      const said = hostSay(host.guessResult(right));
      await Promise.all([voiceOn() ? said : null, wait(1400)]);
      if (!alive()) return;
      setPanel(true);
    });
  };
  const skipGuess = () => {
    if (live.current.phase !== "guess") return;
    cancelSpeech();
    recordQuestion({ walked: true });
    setEndOutcome("walked");
    setPhase("walked");
    setFlashAnswer(true);
    audio.stopMusic(0.4);
    setPanel(true);
  };

  // ---------- lifelines ----------
  const triggerLifeline = (type) => {
    const { phase: ph, lifelines: ll, q: cur, removed: rem, level: lvl } = live.current;
    if (!ANSWERING.has(ph) || ll[type] !== "ready" || !cur) return;
    const g = game.current;
    setSelected(null);
    if (ph === "confirm") setPhase("answer");
    g.qLifelines.push(type);
    g.lifelinesUsed[type] = lvl;
    setLifelines((l) => ({ ...l, [type]: "used" }));
    sfx.select();

    if (type === "fifty") {
      pauseTimer();
      clockPause();
      const said = hostSay(host.lifeline.fifty());
      if (voiceOn()) said.then(() => ANSWERING.has(live.current.phase) && !live.current.overlay && hostSay(host.lifeline.fiftyDone()));
      audio.play("fifty");
      const gone = fiftyFifty(cur.answer, rem);
      setTimeout(() => {
        setRemoved((r) => [...r, ...gone]);
        sfx.whoosh("down", 0.4);
      }, 700);
      setTimeout(() => {
        setHints((h) => [...h, { type: "fifty" }]);
        resumeTimer();
        clockResume();
      }, 1700);
      return;
    }
    if (type === "flip") {
      stopTimer();
      clockPause();
      recordQuestion({ flipped: true });
      sfx.whoosh("up", 0.6);
      setFlipping(true);
      setTimeout(() => beginQuestion(lvl, { flip: true }), 380);
      setTimeout(() => setFlipping(false), 840);
      return;
    }
    pauseTimer();
    clockPause();
    if (type === "poll") hostSay(host.lifeline.poll());
    if (type === "expert") hostSay(host.lifeline.expert());
    if (type === "phone") hostSay(host.lifeline.phone());
    setOverlay(type);
  };

  const closeLifeline = (type, result) => {
    setOverlay(null);
    if (result) setHints((h) => [...h, { type, ...result }]);
    if (type === "phone" && result) {
      game.current.phoneSuggestion = result.index;
      game.current.phoneFriend = result.friend.first;
      hostSay(host.lifeline.phoneAfter(result.friend.first));
    }
    if (type === "expert" && result) hostSay(host.lifeline.expertAfter());
    audio.music(bedFor(live.current.level), { fade: 0.8 });
    resumeTimer();
    clockResume();
  };

  // ---------- pause ----------
  const openPause = () => {
    if (!ANSWERING.has(live.current.phase) || live.current.overlay) return;
    pauseTimer();
    clockPause();
    cancelSpeech();
    audio.duck(0.35);
    setOverlay("pause");
  };
  const closePause = () => {
    setOverlay(null);
    audio.unduck();
    resumeTimer();
    clockResume();
  };

  // ---------- big moments ----------
  const afterMilestone = () => {
    if (live.current.overlay !== "milestone") return;
    setOverlay(null);
    setMood("calm");
    if (live.current.level === FLIP_UNLOCK_AFTER) {
      setLifelines((l) => (l.flip === "locked" ? { ...l, flip: "ready" } : l));
      hostSay(host.flipUnlocked());
    }
    setPanel(true);
  };

  const openDecision = () => {
    setOverlay("decision");
    hostSay(host.jackpotWarn());
  };

  const next = () => {
    const { phase: ph, level: lvl, panel: open, endOutcome: out } = live.current;
    if (!open) return;
    setPanel(false);
    if (ph === "correct") {
      sfx.click();
      beginQuestion(lvl + 1);
    } else if (out) {
      finish(out);
    }
  };

  const finish = (outcome) => {
    const g = game.current;
    if (g.finished) return;
    g.finished = true;
    cancel();
    stopTimer();
    stopHeartbeat();
    cancelSpeech();
    audio.stopMusic(0.6);
    const answered = g.records.filter((r) => !r.flipped);
    const correctCount = answered.filter((r) => r.correct).length;
    const lastLevel = live.current.level;
    const prize = outcome === "won" ? amountFor(TOTAL_LEVELS) : outcome === "wrong" ? safeAmount(lastLevel) : amountFor(correctCount);
    const record = {
      id: g.id,
      startedAt: g.startedAt,
      endedAt: Date.now(),
      outcome,
      level: lastLevel,
      correct: correctCount,
      prize,
      questions: g.records,
      lifelines: g.lifelinesUsed,
      iqBefore: iqOf(g.ratingBefore.theta),
      iqAfter: iqOf(g.rating.theta),
      fff: fff ?? null,
      guessCorrect: g.guessCorrect,
      mode: live.current.settings.difficulty,
    };
    const ctx = { game: record, history: [record, ...history], rating: g.rating, iq: record.iqAfter };
    const unlocked = ACHIEVEMENTS.filter((a) => !profile.achievements?.[a.id] && a.check(ctx)).map((a) => a.id);
    recordGame(record);
    updateProfile((p) => ({
      rating: g.rating,
      achievements: { ...p.achievements, ...Object.fromEntries(unlocked.map((id) => [id, Date.now()])) },
    }));
    onFinish(record, unlocked);
  };

  // ---------- intro ----------
  useEffect(() => {
    audio.unlock();
    audio.music("letsPlay", { fade: 0.2 });
    setMood("celebrate");
    sfx.applause(3, 0.5);
    run(async (wait, alive) => {
      const welcome = hostSay(host.welcome(profile.name, profile.city), "excited");
      await Promise.all([voiceOn() ? welcome : null, wait(2900)]);
      if (!alive()) return;
      setMood("calm");
      setIntroStep(1);
      const rules = hostSay(host.rules());
      await Promise.all([voiceOn() ? rules : null, wait(2600)]);
      if (!alive()) return;
      beginQuestion(1);
    });
    return () => {
      stopHeartbeat();
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On untimed questions, the host nudges a player who has been thinking for a long while.
  useEffect(() => {
    if (phase !== "answer" || timeLimit || overlay) return;
    const t = setTimeout(() => {
      if (live.current.phase === "answer" && !live.current.overlay) hostSay(host.idle());
    }, 28000);
    return () => clearTimeout(t);
  }, [phase, timeLimit, overlay, q]);

  // ---------- keyboard ----------
  const keys = useRef();
  keys.current = (e) => {
    if (live.current.overlay || e.repeat) return;
    if (e.target?.closest?.("input, textarea")) return;
    const k = e.key.toLowerCase();
    const idx = { a: 0, b: 1, c: 2, d: 3, 1: 0, 2: 1, 3: 2, 4: 3 }[k];
    const ph = live.current.phase;
    if (idx !== undefined) {
      if (ph === "guess") guessAnswer(idx);
      else pickOption(idx);
      return;
    }
    if ((k === " " || k === "enter") && (ph === "announce" || ph === "reveal")) {
      e.preventDefault();
      return skipNarration();
    }
    if (k === "enter") {
      if (e.target?.tagName === "BUTTON") return;
      if (ph === "confirm") {
        e.preventDefault();
        lockAnswer(live.current.selected);
      } else if (live.current.panel) {
        e.preventDefault();
        next();
      }
    } else if (k === "escape") {
      if (ph === "confirm") cancelSelection();
      else if (ph === "answer") openPause();
    }
  };
  useEffect(() => {
    const h = (e) => keys.current(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // ---------- render ----------
  const banked = amountFor(game.current.records.filter((r) => r.correct).length);
  const canAct = ANSWERING.has(phase) && !overlay;
  const cat = q ? CATEGORY_BY_ID[q.c] : null;
  const showTimer = timeLimit && ["announce", "reveal", "answer", "confirm", "locked"].includes(phase);
  const reached = game.current.records.filter((r) => r.correct).length;
  const nextLabel = phase === "correct" ? (level === TOTAL_LEVELS ? "Collect" : "Agla Sawaal") : "See your result";
  const boardInteractive = (canAct && shown >= 4) || phase === "guess";

  return (
    <div className={`hs hs--${phase}`}>
      <header className="hs__top">
        <div className="hs__brand">
          <Logo size={48} spin={false} shine={false} />
          <div className="hs__player">
            <Avatar config={profile.avatar} size={36} ring />
            <div>
              <div className="hs__name">{profile.name}</div>
              <div className="hs__sub">{phase === "intro" ? "Hot seat" : `Q${level} of ${TOTAL_LEVELS} · for ${shortINR(amountFor(level))}`}</div>
            </div>
          </div>
        </div>
        <div className="hs__mobile-ll">
          <LifelineBar state={lifelines} onUse={triggerLifeline} enabled={canAct && shown >= 4} />
        </div>
        <div className="hs__actions">
          <div className="hs__bank" title="Money you have won so far">
            <span className="hs__bank-label">Winnings</span>
            <AnimatedMoney value={banked} className="hs__bank-value t-num" />
          </div>
          <Button variant="glass" size="sm" icon={LogOut} disabled={!canAct || reached === 0} onClick={openQuit} title={reached === 0 ? "Win at least one question first" : "Walk away with your winnings"}>
            <span className="hs__btn-text">Quit</span>
          </Button>
          <Button variant="glass" size="sm" icon={Pause} aria-label="Pause" disabled={!canAct} onClick={openPause} />
          <Button variant="glass" size="sm" icon={ListOrdered} aria-label="Prize ladder" className="hs__ladder-btn" onClick={() => setLadderOpen(true)} />
        </div>
      </header>

      <main className="hs__main">
        <section className="hs__center">
          <div className="hs__hero">
            <AnimatePresence mode="wait">
              {phase === "intro" ? (
                <motion.div key="intro" className="intro-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.6 }}>
                  <div className="intro-card__spot" />
                  <Avatar config={profile.avatar} size={150} ring />
                  <div className="intro-card__name t-display t-gold">{profile.name}</div>
                  {profile.city && <div className="intro-card__city">{profile.city}</div>}
                  <div className="intro-card__label">{introStep ? "16 questions · 2 milestones · 4 lifelines + 1 to unlock" : "Welcome to the hot seat"}</div>
                  <Button variant="glass" size="sm" icon={SkipForward} onClick={() => beginQuestion(1)}>
                    Skip intro
                  </Button>
                </motion.div>
              ) : (
                <motion.div key="play" className="hs__hero-play" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className={`hs__emblem${phase === "locked" ? " is-pulse" : ""}`}>
                    <Logo size="min(25vh, 230px)" shine={false} />
                  </div>
                  <div className="hs__overlay-slot">
                    <AnimatePresence mode="wait">
                      {panel && q ? (
                        <RevealPanel key="panel" phase={phase} q={q} amount={amountFor(level)} onNext={next} nextLabel={nextLabel} guessRight={game.current.guessCorrect} />
                      ) : (
                        <motion.div key="live" className="hs__live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          {showTimer ? (
                            <motion.div key={`timer-${q?.id}`} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                              <Timer total={timeLimit} left={timeLeft} paused={!timerRunning && phase !== "locked" && !!overlay} />
                            </motion.div>
                          ) : ANSWERING.has(phase) ? (
                            <div className="hs__notimer">
                              <Clock3 size={16} /> No time limit — take your time
                            </div>
                          ) : null}
                          <AnimatePresence>
                            {phase === "confirm" && selected != null && (
                              <ConfirmBar key="confirm" letter={LETTERS[selected]} text={q.options[selected]} onLock={() => lockAnswer(selected)} onCancel={cancelSelection} />
                            )}
                            {phase === "guess" && <GuessBar key="guess" onSkip={skipGuess} />}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <HostBanner line={line} language={settings.language} />

          <div className="hs__boardwrap">
            <div className="hs__meta">
              {cat && phase !== "intro" && (
                <motion.span key={q.id} className="chip hs__cat" style={{ "--cat": cat.color }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <CategoryIcon id={cat.id} size={14} /> {cat.name}
                </motion.span>
              )}
              {settings.hostVoice && (phase === "announce" || phase === "reveal") ? (
                <Button variant="ghost" size="sm" icon={SkipForward} onClick={skipNarration} quiet>
                  Skip <span className="kbd">Space</span>
                </Button>
              ) : (
                <HintsDock hints={hints} />
              )}
            </div>
            <QuestionBoard
              q={q}
              qVisible={qVisible}
              shown={shown}
              selected={selected}
              locked={locked}
              removed={removed}
              phase={phase === "guessed" ? "guess" : phase}
              flashAnswer={flashAnswer}
              guess={guess}
              onPick={(i) => (phase === "guess" ? guessAnswer(i) : pickOption(i))}
              flipping={flipping}
              interactive={boardInteractive}
            />
          </div>
        </section>

        <aside className={`hs__side${ladderOpen ? " is-open" : ""}`}>
          <div className="hs__side-head">
            <span className="eyebrow">Lifelines</span>
            <Button variant="ghost" size="sm" icon={X} aria-label="Close ladder" className="hs__side-close" onClick={() => setLadderOpen(false)} />
          </div>
          <LifelineBar state={lifelines} onUse={(t) => (setLadderOpen(false), triggerLifeline(t))} enabled={canAct && shown >= 4} />
          <MoneyLadder current={phase === "intro" ? null : level} reached={reached} />
          <div className="hs__guarantee">
            Guaranteed <b className="t-num">{formatINR(safeAmount(level + (phase === "correct" ? 1 : 0)))}</b>
          </div>
        </aside>
        {ladderOpen && <div className="hs__scrim" onClick={() => setLadderOpen(false)} />}
      </main>

      {overlay === "poll" && q && <AudiencePoll q={q} removed={removed} settings={settings} onClose={(r) => closeLifeline("poll", r)} />}
      {overlay === "phone" && q && <PhoneAFriend q={q} removed={removed} level={level} settings={settings} playerName={profile.name} onClose={(r) => closeLifeline("phone", r)} />}
      {overlay === "expert" && q && <AskExpert q={q} removed={removed} voice={settings.lifelineVoice} onClose={(r) => closeLifeline("expert", r)} />}
      {overlay === "quit" && <QuitDialog amount={banked} onConfirm={confirmQuit} onCancel={cancelQuit} />}
      {overlay === "pause" && <PauseDialog settings={settings} updateSettings={updateSettings} canQuit={reached > 0} onResume={closePause} onQuit={() => (closePause(), openQuit())} />}
      {overlay === "decision" && (
        <JackpotDialog
          onPlay={() => {
            setOverlay(null);
            beginQuestion(TOTAL_LEVELS);
          }}
          onWalk={() => {
            setOverlay(null);
            finish("walked");
          }}
        />
      )}
      <AnimatePresence>
        {overlay === "milestone" && <MilestoneOverlay key="ms" level={level} onDone={afterMilestone} />}
        {overlay === "crore" && <BigWinOverlay key="crore" name={profile.name} onDone={openDecision} />}
        {overlay === "jackpot" && <BigWinOverlay key="jackpot" jackpot name={profile.name} onDone={() => finish("won")} />}
      </AnimatePresence>
    </div>
  );
}
