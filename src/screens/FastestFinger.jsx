import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Crown, Delete, Play, RotateCcw, Check, X, Zap } from "lucide-react";
import Logo from "../components/Logo";
import Lozenge from "../components/Lozenge";
import Avatar from "../components/Avatar";
import { Button } from "../components/ui";
import { CategoryIcon } from "../components/icons";
import { useStage, useStageMood } from "../components/Stage";
import { useApp } from "../state/AppContext";
import { useSequencer } from "../hooks/useSequencer";
import { FFF_QUESTIONS } from "../data/questions";
import { CATEGORY_BY_ID } from "../data/categories";
import { RIVALS } from "../data/people";
import { prepareFFF, topicWeight } from "../engine/selector";
import { simulateFFF } from "../engine/lifelines";
import { audio } from "../audio/engine";
import { cancelSpeech } from "../audio/speech";
import { useHost } from "../hooks/useHost";
import { host } from "../data/host";
import { sfx } from "../audio/synth";
import { LETTERS } from "../lib/format";
import { weightedIndex } from "../lib/random";
import "../styles/fff.css";

const LIMIT_MS = 20000;
const MAX_ROUNDS = 3;

export default function FastestFinger({ onWin, onExit }) {
  useStageMood("fff");
  const { flash, setMood } = useStage();
  const { profile, seen, markSeen } = useApp();
  const { run } = useSequencer();
  const voice = useHost();

  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState("intro"); // intro | countdown | question | answer | locked | reveal | results
  const [count, setCount] = useState(3);
  const [item, setItem] = useState(null);
  const [shown, setShown] = useState(0);
  const [order, setOrder] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [results, setResults] = useState(null);
  const [lockedIn, setLockedIn] = useState(() => new Set());
  const startAt = useRef(0);
  const player = useRef(null);
  const used = useRef(new Set());
  const live = useRef({});
  live.current = { phase, order, item };

  useEffect(() => {
    audio.unlock();
    audio.music("theme", { fade: 0.5 });
    const t = setTimeout(() => voice.say(host.fff.intro()), 600);
    return () => {
      clearTimeout(t);
      cancelSpeech();
    };
  }, [voice]);

  const pickItem = () => {
    const pool = FFF_QUESTIONS.filter((x) => !used.current.has(x.id));
    const weights = pool.map((x) => Math.max(0.05, topicWeight(profile.relevance, x.c)) * (seen[x.id] ? 0.04 : 1));
    return pool[weightedIndex(weights)];
  };

  const startRound = (r) => {
    const raw = pickItem();
    if (!raw) return onWin({ won: false, wildcard: true, round: r });
    used.current.add(raw.id);
    markSeen([raw.id]);
    setRound(r);
    const prepared = prepareFFF(raw);
    setItem(prepared);
    setOrder([]);
    setShown(0);
    setRevealed(0);
    setResults(null);
    setLockedIn(new Set());
    setElapsed(0);
    setPhase("countdown");
    setMood("fff");
    audio.stopMusic(0.6);
    cancelSpeech();
    run(async (wait, alive) => {
      for (let c = 3; c >= 1; c--) {
        setCount(c);
        sfx.warnBeep();
        await wait(820);
      }
      sfx.boom();
      flash("white");
      audio.music("bedHard", { fade: 0.4, volume: 0.5 });
      setPhase("question");
      sfx.reveal();
      // The host reads the question and the four items, then starts the clock.
      if (voice.on()) {
        await wait(350);
        await voice.read(prepared.q, "calm");
        for (let i = 1; i <= 4; i++) {
          if (!alive()) return;
          setShown(i);
          sfx.optionIn();
          await voice.read(`${LETTERS[i - 1]}| ${prepared.options[i - 1]}`);
          await wait(60);
        }
        if (!alive()) return;
        await voice.say(host.fff.go());
      } else {
        await wait(950);
        for (let i = 1; i <= 4; i++) {
          setShown(i);
          sfx.optionIn();
          await wait(240);
        }
      }
      if (!alive()) return;
      startAt.current = performance.now();
      setPhase("answer");
    });
  };

  // Hundredths clock while answering.
  useEffect(() => {
    if (phase !== "answer") return;
    const id = setInterval(() => {
      const t = performance.now() - startAt.current;
      setElapsed(Math.min(t, LIMIT_MS));
      if (t >= LIMIT_MS) {
        clearInterval(id);
        submit(live.current.order);
      }
    }, 33);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const choose = (i) => {
    const { phase: ph, order: cur } = live.current;
    if (ph !== "answer" || cur.includes(i)) return;
    const next = [...cur, i];
    sfx.keypad();
    setOrder(next);
    if (next.length === 4) submit(next);
  };
  const undo = () => {
    if (live.current.phase !== "answer" || !live.current.order.length) return;
    sfx.back();
    setOrder((o) => o.slice(0, -1));
  };
  const clear = () => {
    if (live.current.phase !== "answer") return;
    sfx.back();
    setOrder([]);
  };

  const submit = (finalOrder) => {
    const { item: it, phase: ph } = live.current;
    if (ph !== "answer") return;
    const t = Math.min(LIMIT_MS, performance.now() - startAt.current);
    const correct = finalOrder.length === 4 && finalOrder.every((v, k) => v === it.solution[k]);
    player.current = { correct, timeMs: Math.round(t), order: finalOrder };
    setElapsed(t);
    setPhase("locked");
    sfx.lock();
    const sim = simulateFFF({ rivals: RIVALS, round, playerCorrect: correct, playerTimeMs: t });
    const all = [
      { id: "you", isPlayer: true, name: profile.name, city: profile.city, avatar: profile.avatar, correct, timeMs: Math.round(t) },
      ...sim.map((s) => ({ ...RIVALS.find((r) => r.id === s.id), ...s })),
    ];
    run(async (wait, alive) => {
      for (const s of [...sim].sort((a, b) => a.timeMs - b.timeMs)) {
        setLockedIn((prev) => new Set(prev).add(s.id));
        sfx.keypad();
        await wait(110);
      }
      const lockedLine = voice.say(host.fff.locked());
      await Promise.all([lockedLine, wait(600)]);
      if (!alive()) return;
      audio.stopMusic(0.6);
      setPhase("reveal");
      await voice.say(host.fff.order(), "dramatic");
      for (let k = 1; k <= 4; k++) {
        if (!alive()) return;
        setRevealed(k);
        sfx.tick();
        await Promise.all([voice.read(LETTERS[it.solution[k - 1]]), wait(650)]);
      }
      sfx.ding();
      await wait(600);
      const ranked = [...all].sort((a, b) => (a.correct === b.correct ? a.timeMs - b.timeMs : a.correct ? -1 : 1));
      setResults(ranked);
      setPhase("results");
      const top = ranked[0];
      if (top?.isPlayer && top.correct) {
        flash("gold");
        setMood("celebrate");
        sfx.fanfare();
        sfx.applause(4.5, 0.85);
        audio.play("winner");
        voice.say(host.fff.winner(profile.name, (top.timeMs / 1000).toFixed(2)), "excited");
      } else {
        sfx.error();
        setMood("calm");
        const verdict = top?.correct ? host.fff.lost(top.name, top.city) : host.fff.nobody();
        voice.say(verdict).then(() => alive() && voice.say(round < MAX_ROUNDS ? host.fff.nextRound() : host.fff.wildcard()));
      }
    });
  };

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      const idx = { a: 0, b: 1, c: 2, d: 3, 1: 0, 2: 1, 3: 2, 4: 3 }[k];
      if (idx !== undefined) return choose(idx);
      if (k === "backspace") undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cat = item ? CATEGORY_BY_ID[item.c] : null;
  const winner = results?.[0];
  const playerWon = !!(winner?.isPlayer && winner.correct);
  const secondsLeft = Math.max(0, (LIMIT_MS - elapsed) / 1000);
  const rivalsById = useMemo(() => Object.fromEntries(RIVALS.map((r) => [r.id, r])), []);

  return (
    <div className={`fff fff--${phase}`}>
      <header className="fff__top">
        <Button variant="glass" size="sm" icon={ArrowLeft} onClick={onExit}>
          Menu
        </Button>
        <div className="fff__title">
          <Zap size={22} className="fff__bolt" />
          <span className="t-display t-gold">Fastest Finger First</span>
        </div>
        <div className="fff__round chip chip--gold">
          Round {round} / {MAX_ROUNDS}
        </div>
      </header>

      <div className="fff__main">
        <aside className="fff__board glass" aria-label="Contestants">
          <div className="fff__board-head eyebrow">Contestants</div>
          <ul className="fff__list">
            {(results ?? [{ id: "you", isPlayer: true, name: profile.name, city: profile.city, avatar: profile.avatar }, ...RIVALS]).map((c, i) => {
              const r = results ? c : null;
              const isWinner = r && i === 0 && r.correct;
              const isLocked = c.isPlayer ? ["locked", "reveal", "results"].includes(phase) : lockedIn.has(c.id);
              return (
                <motion.li
                  key={c.id}
                  layout
                  className={`fff__row${c.isPlayer ? " is-you" : ""}${isWinner ? " is-winner" : ""}${r && !r.correct ? " is-wrong" : ""}`}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <span className="fff__rank t-num">{results ? i + 1 : ""}</span>
                  <Avatar config={c.avatar ?? rivalsById[c.id]?.avatar} size={34} />
                  <span className="fff__who">
                    <span className="fff__name">
                      {c.isPlayer ? `${c.name} (You)` : c.name}
                      {isWinner && <Crown size={14} className="fff__crown" />}
                    </span>
                    <span className="fff__city">{c.city}</span>
                  </span>
                  <span className="fff__state t-num">
                    {r ? (
                      r.correct ? (
                        <>
                          <Check size={14} /> {(r.timeMs / 1000).toFixed(2)}s
                        </>
                      ) : (
                        <X size={14} />
                      )
                    ) : isLocked ? (
                      <span className="fff__lit" />
                    ) : phase === "answer" ? (
                      <span className="fff__thinking" />
                    ) : null}
                  </span>
                </motion.li>
              );
            })}
          </ul>
        </aside>

        <section className="fff__stage">
          <AnimatePresence mode="wait">
            {phase === "intro" && (
              <motion.div key="intro" className="fff__intro glass glass--gold" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <Logo size={110} />
                <h1 className="fff__intro-title t-display t-gold">Fastest Finger First</h1>
                <p className="fff__intro-hi">Sabse pehle sahi kram mein lagaiye — aur hot seat aapki!</p>
                <ul className="fff__rules">
                  <li>Put the four answers in the correct order, as fast as you can.</li>
                  <li>
                    Tap them in sequence or press <span className="kbd">A</span>–<span className="kbd">D</span>. <span className="kbd">⌫</span> undoes.
                  </li>
                  <li>The fastest correct contestant takes the hot seat. You have 20 seconds.</li>
                </ul>
                <Button variant="gold" size="lg" icon={Play} onClick={() => startRound(1)}>
                  I'm ready
                </Button>
              </motion.div>
            )}

            {phase === "countdown" && (
              <motion.div key="count" className="fff__count" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AnimatePresence mode="popLayout">
                  <motion.span key={count} className="fff__count-num t-display t-gold" initial={{ scale: 2.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ duration: 0.45 }}>
                    {count}
                  </motion.span>
                </AnimatePresence>
                <div className="fff__count-label">Get ready…</div>
              </motion.div>
            )}

            {item && !["intro", "countdown"].includes(phase) && (
              <motion.div key={`q-${item.id}`} className="fff__play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="fff__clock-row">
                  {cat && (
                    <span className="chip fff__cat" style={{ "--cat": cat.color }}>
                      <CategoryIcon id={cat.id} size={14} /> {cat.name}
                    </span>
                  )}
                  <div className={`fff__clock t-num${secondsLeft < 5 && phase === "answer" ? " is-low" : ""}`}>{phase === "answer" ? secondsLeft.toFixed(2) : (elapsed / 1000).toFixed(2)}</div>
                </div>

                <div className="rail fff__qrow">
                  <Lozenge size="q" state="idle">
                    <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                      {item.q}
                    </motion.span>
                  </Lozenge>
                </div>

                <div className="fff__opts">
                  {[0, 2].map((row) => (
                    <div key={row} className="rail fff__orow">
                      {[row, row + 1].map((i) => {
                        const pos = order.indexOf(i);
                        const visible = shown > i;
                        const inReveal = phase === "reveal" || phase === "results";
                        const correctPos = item.solution.indexOf(i);
                        const state = inReveal && correctPos < revealed ? "correct" : pos >= 0 ? "locked" : "idle";
                        return (
                          <Lozenge
                            key={i}
                            as="button"
                            type="button"
                            size="opt"
                            state={state}
                            interactive={phase === "answer" && pos < 0}
                            disabled={phase !== "answer" || pos >= 0}
                            onClick={() => choose(i)}
                            className="fff__opt"
                          >
                            <span className="lz__label">{LETTERS[i]}:</span>
                            <span className="fff__otext">{visible ? item.options[i] : ""}</span>
                            {pos >= 0 && !inReveal && <span className="fff__pos t-num">{pos + 1}</span>}
                            {inReveal && correctPos < revealed && <span className="fff__pos fff__pos--ok t-num">{correctPos + 1}</span>}
                          </Lozenge>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="fff__seqs">
                  <div className="fff__seq">
                    <span className="fff__seq-label">Your order</span>
                    <div className="fff__slots">
                      {[0, 1, 2, 3].map((k) => {
                        const v = order[k];
                        const verdict = phase === "results" && v != null ? (v === item.solution[k] ? " is-ok" : " is-bad") : "";
                        return (
                          <span key={k} className={`fff__slot${v != null ? " is-filled" : ""}${verdict}`}>
                            {v != null ? LETTERS[v] : ""}
                          </span>
                        );
                      })}
                    </div>
                    {phase === "answer" && (
                      <div className="fff__tools">
                        <Button variant="glass" size="sm" icon={Delete} onClick={undo} disabled={!order.length} quiet>
                          Undo
                        </Button>
                        <Button variant="ghost" size="sm" icon={RotateCcw} onClick={clear} disabled={!order.length} quiet>
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>
                  {(phase === "reveal" || phase === "results") && (
                    <motion.div className="fff__seq" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <span className="fff__seq-label">Correct order</span>
                      <div className="fff__slots">
                        {item.solution.map((v, k) => (
                          <motion.span key={k} className={`fff__slot is-answer${k < revealed ? " is-filled" : ""}`} animate={k < revealed ? { scale: [1.3, 1] } : {}}>
                            {k < revealed ? LETTERS[v] : ""}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                <AnimatePresence>
                  {phase === "results" && (
                    <motion.div className={`fff__verdict glass${playerWon ? " glass--gold is-win" : ""}`} initial={{ opacity: 0, y: 24, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 240, damping: 22 }}>
                      <p className="fff__fact">{item.f}</p>
                      {playerWon ? (
                        <>
                          <div className="fff__verdict-title t-display t-gold">Congratulations, {profile.name}!</div>
                          <p>
                            Fastest correct answer in <b className="t-num">{(player.current.timeMs / 1000).toFixed(2)}s</b>. Hot seat ki taraf badhiye!
                          </p>
                          <Button variant="gold" size="lg" iconRight={ArrowRight} autoFocus onClick={() => onWin({ won: true, timeMs: player.current.timeMs, round })}>
                            Take the hot seat
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="fff__verdict-title t-display">{player.current?.correct ? "So close!" : "Not this time"}</div>
                          <p>
                            {winner?.correct ? `${winner.name} from ${winner.city} was fastest at ${(winner.timeMs / 1000).toFixed(2)}s.` : "Nobody got it right."}{" "}
                            {round < MAX_ROUNDS ? "Another round coming up!" : "But the host has a surprise for you…"}
                          </p>
                          {round < MAX_ROUNDS ? (
                            <Button variant="gold" icon={RotateCcw} autoFocus onClick={() => startRound(round + 1)}>
                              Next round
                            </Button>
                          ) : (
                            <Button variant="gold" iconRight={ArrowRight} autoFocus onClick={() => onWin({ won: false, wildcard: true, round })}>
                              Wildcard entry — take the hot seat
                            </Button>
                          )}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
