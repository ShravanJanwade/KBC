import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, Grid3x3, Volume2, UserPlus, Video, Users, PhoneOff, Phone, Signal, Wifi, BatteryFull, Search, Star, ArrowRight } from "lucide-react";
import Avatar from "../../components/Avatar";
import { BACKGROUNDS } from "../../components/avatarParts";
import { Modal, Button } from "../../components/ui";
import { CategoryIcon } from "../../components/icons";
import Timer from "./Timer";
import { FRIENDS } from "../../data/people";
import { CATEGORY_BY_ID } from "../../data/categories";
import { amountFor } from "../../data/prizes";
import { friendAnswer } from "../../engine/lifelines";
import { useSequencer } from "../../hooks/useSequencer";
import { audio } from "../../audio/engine";
import { sfx } from "../../audio/synth";
import { say, cancelSpeech } from "../../audio/speech";
import { LETTERS, formatClock, shortINR } from "../../lib/format";
import { pick } from "../../lib/random";

const CALL_SECONDS = 30;

function buildScript(friend, q, res, removed, level) {
  const L = LETTERS[res.index];
  const text = q.options[res.index];
  const opts = [0, 1, 2, 3]
    .filter((i) => !removed.includes(i))
    .map((i) => `${LETTERS[i]}: ${q.options[i]}`)
    .join("  ·  ");
  const think = {
    sure: pick(["Oh, this one I know!", "Arre, easy one! Ek second…", "Haan haan, I remember this."]),
    unsure: pick(["Hmm… let me think…", "Ek minute… I've read about this somewhere…", "Wait, wait… don't rush me…"]),
    clueless: pick(["Arre yaar, that's a tough one…", "Oof. Honestly, I'm blanking…", "Hmm, that's really not my area…"]),
  }[res.mood];
  const answer = {
    sure: `It's ${L} — ${text}. I'm ${res.confidence}% sure. Lock it!`,
    unsure: `I think it's ${L}, ${text}… maybe ${res.confidence}% sure. Don't go only by me.`,
    clueless: `If I had to guess, I'd say ${L} — ${text}. Only ${res.confidence}% sure, so be careful.`,
  }[res.mood];
  const bye = res.mood === "sure" ? pick(["All the best! Jeet ke aana!", "Go win it! Party pakki!"]) : pick(["Sorry I couldn't be surer. All the best!", "Trust your gut. Best of luck!"]);
  return [
    { who: "friend", text: friend.greeting },
    { who: "you", text: `Hi ${friend.first}! I'm on the hot seat — this one's for ${shortINR(amountFor(level))}.` },
    { who: "you", text: `${q.q}  ${opts}` },
    { who: "friend", text: think },
    { who: "friend", text: answer, isAnswer: true },
    { who: "friend", text: bye },
  ];
}

const prettyNumber = (digits) => {
  const d = digits.padEnd(10, " ");
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`.trimEnd();
};

export default function PhoneAFriend({ q, removed, level, voice, onClose }) {
  const [stage, setStage] = useState("contacts");
  const [friend, setFriend] = useState(null);
  const [result, setResult] = useState(null);
  const [dialed, setDialed] = useState("");
  const [lines, setLines] = useState([]);
  const [speaking, setSpeaking] = useState(null);
  const [left, setLeft] = useState(CALL_SECONDS);
  const [revealed, setRevealed] = useState(false);
  const [cutOff, setCutOff] = useState(false);
  const [muted, setMuted] = useState(false);
  const revealedRef = useRef(false);
  const stopRing = useRef(null);
  const { run, cancel } = useSequencer();
  const cat = CATEGORY_BY_ID[q.c];
  const clock = useMemo(() => new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: false }), []);

  const hangUp = (timedOut) => {
    cancel();
    cancelSpeech();
    stopRing.current?.();
    stopRing.current = null;
    audio.stopMusic(0.4);
    sfx.hangup();
    setSpeaking(null);
    setCutOff(timedOut && !revealedRef.current);
    revealedRef.current = true;
    setRevealed(true);
    setStage("ended");
  };
  const hangUpRef = useRef(hangUp);
  hangUpRef.current = hangUp;

  useEffect(
    () => () => {
      stopRing.current?.();
      cancelSpeech();
    },
    []
  );

  // The KBC 30-second clock starts when the friend picks up.
  useEffect(() => {
    if (stage !== "connected") return;
    const start = performance.now();
    const id = setInterval(() => {
      const l = Math.max(0, CALL_SECONDS - (performance.now() - start) / 1000);
      setLeft(l);
      if (l <= 0) {
        clearInterval(id);
        hangUpRef.current(true);
      }
    }, 100);
    return () => clearInterval(id);
  }, [stage]);

  const call = (f) => {
    sfx.click();
    const res = friendAnswer(f, { answer: q.answer, d: q.d, c: q.c, removed });
    const script = buildScript(f, q, res, removed, level);
    setFriend(f);
    setResult(res);
    setStage("dialing");
    run(async (wait) => {
      const digits = f.phone.replace(/\D/g, "").slice(-10);
      await wait(450);
      for (let i = 0; i < digits.length; i++) {
        setDialed(digits.slice(0, i + 1));
        sfx.dtmf(digits[i]);
        await wait(118);
      }
      await wait(650);
      setStage("ringing");
      stopRing.current = sfx.ringback();
      await wait(3100 + Math.random() * 1700);
      stopRing.current?.();
      stopRing.current = null;
      sfx.pickup();
      setStage("connected");
      audio.music("phone", { fade: 0.8, volume: 0.26 });
      await wait(650);
      for (const line of script) {
        setLines((ls) => [...ls, line]);
        setSpeaking(line.who);
        if (line.isAnswer) {
          revealedRef.current = true;
          setRevealed(true);
        }
        const minMs = Math.max(1300, line.text.length * (line.who === "you" ? 36 : 50));
        if (voice && line.who === "friend") await Promise.all([say(line.text, f.voice), wait(minMs * 0.5)]);
        else await wait(minMs);
        setSpeaking(null);
        await wait(320);
      }
      await wait(800);
      hangUpRef.current(false);
    });
  };

  const [bg1, bg2] = BACKGROUNDS[friend?.avatar.bg ?? 0];

  return (
    <Modal open size="full" dismissible={false} label="Phone a friend" className="paf-modal">
      <div className="paf">
        <aside className="paf__side">
          <div className="eyebrow">Lifeline · Phone a Friend</div>
          <Timer total={CALL_SECONDS} left={left} paused={stage !== "connected"} size={150} />
          <p className="paf__clock-note">{stage === "connected" ? "Call clock running" : stage === "ended" ? "Call finished" : "The 30-second clock starts when your friend picks up"}</p>
          <div className="paf__qcard card">
            <div className="paf__qcat" style={{ "--cat": cat?.color }}>
              <CategoryIcon id={q.c} size={15} /> {cat?.name} · {shortINR(amountFor(level))}
            </div>
            <div className="paf__qtext">{q.q}</div>
            <ul className="paf__qopts">
              {q.options.map((o, i) =>
                removed.includes(i) ? null : (
                  <li key={i}>
                    <b>{LETTERS[i]}:</b> {o}
                  </li>
                )
              )}
            </ul>
          </div>
        </aside>

        <div className="phone">
          <div className="phone__frame">
            <div className="phone__island" />
            <div className="phone__status">
              <span className="t-num">{clock}</span>
              <span className="phone__status-icons">
                <Signal size={13} />
                <span className="phone__net">5G</span>
                <Wifi size={13} />
                <BatteryFull size={16} />
              </span>
            </div>

            <div className="phone__screen">
              <AnimatePresence mode="wait">
                {stage === "contacts" && (
                  <motion.div key="contacts" className="contacts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
                    <div className="contacts__title">Favourites</div>
                    <div className="contacts__search">
                      <Search size={14} /> Search contacts
                    </div>
                    <div className="contacts__hint">
                      Topic: <span style={{ color: cat?.color }}>{cat?.name}</span> — pick the friend most likely to know.
                    </div>
                    <ul className="contacts__list scroll">
                      {FRIENDS.map((f, i) => {
                        const match = f.strengths.includes(q.c);
                        return (
                          <motion.li key={f.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                            <button type="button" className="contact" onClick={() => call(f)} onMouseEnter={() => sfx.hover()}>
                              <Avatar config={f.avatar} size={46} />
                              <span className="contact__text">
                                <span className="contact__name">
                                  {f.name}
                                  {match && (
                                    <span className="contact__match" title="Strong in this topic">
                                      <Star size={11} fill="currentColor" />
                                    </span>
                                  )}
                                </span>
                                <span className="contact__meta">
                                  {f.relation} · {f.job}
                                </span>
                                <span className="contact__tags">
                                  {f.strengths.map((c) => (
                                    <span key={c} style={{ "--cat": CATEGORY_BY_ID[c].color }} className={c === q.c ? "is-match" : ""}>
                                      {CATEGORY_BY_ID[c].name.split(/[ &,]/)[0]}
                                    </span>
                                  ))}
                                </span>
                              </span>
                              <span className="contact__call">
                                <Phone size={16} />
                              </span>
                            </button>
                          </motion.li>
                        );
                      })}
                    </ul>
                  </motion.div>
                )}

                {(stage === "dialing" || stage === "ringing" || stage === "connected") && friend && (
                  <motion.div key="call" className="call" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    <div className="call__bg" style={{ background: `radial-gradient(120% 70% at 50% 20%, ${bg1}aa, ${bg2}ee 55%, #05031a)` }} />
                    <div className="call__head">
                      <div className="call__status">
                        {stage === "dialing" && "calling mobile…"}
                        {stage === "ringing" && "ringing…"}
                        {stage === "connected" && (
                          <>
                            <span className="call__hd">HD</span> {formatClock(CALL_SECONDS - left)}
                          </>
                        )}
                      </div>
                      <div className="call__name">{friend.name}</div>
                      <div className="call__number t-num">{stage === "dialing" ? prettyNumber(dialed) : `${friend.relation} · ${friend.city}`}</div>
                    </div>

                    <div className={`call__avatar${stage !== "connected" ? " is-ringing" : ""}${speaking === "friend" ? " is-speaking" : ""}`}>
                      <span className="call__pulse" />
                      <span className="call__pulse call__pulse--2" />
                      <Avatar config={friend.avatar} size={104} />
                    </div>

                    <div className="call__captions" aria-live="polite">
                      {stage === "connected" ? (
                        lines.slice(-3).map((l, i, arr) => <Caption key={lines.length - arr.length + i} line={l} friend={friend} active={i === arr.length - 1 && speaking === l.who} />)
                      ) : (
                        <div className="call__waiting">{stage === "dialing" ? "Dialling…" : "Waiting for an answer…"}</div>
                      )}
                    </div>

                    <div className="call__controls">
                      <CallBtn icon={muted ? MicOff : Mic} label={muted ? "unmute" : "mute"} active={muted} onClick={() => setMuted((m) => !m)} />
                      <CallBtn icon={Grid3x3} label="keypad" />
                      <CallBtn icon={Volume2} label="speaker" active />
                      <CallBtn icon={UserPlus} label="add call" />
                      <CallBtn icon={Video} label="video" />
                      <CallBtn icon={Users} label="contacts" />
                    </div>
                    <button
                      type="button"
                      className="call__end"
                      aria-label="End call"
                      disabled={stage === "connected" && !revealed}
                      title={stage === "connected" && !revealed ? "Wait for your friend's answer" : "End call"}
                      onClick={() => hangUp(false)}
                    >
                      <PhoneOff size={26} />
                    </button>
                  </motion.div>
                )}

                {stage === "ended" && friend && result && (
                  <motion.div key="ended" className="ended" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="ended__title">Call ended</div>
                    <div className="ended__time t-num">{formatClock(CALL_SECONDS - left)}</div>
                    <Avatar config={friend.avatar} size={78} ring />
                    <div className="ended__card">
                      <div className="eyebrow">{friend.first} suggests</div>
                      <div className="ended__answer">
                        <span className="ended__letter t-num">{LETTERS[result.index]}</span>
                        <span>{q.options[result.index]}</span>
                      </div>
                      <div className="ended__conf">
                        <span>Confidence</span>
                        <div className="bar">
                          <span style={{ width: `${result.confidence}%`, background: result.confidence >= 70 ? "linear-gradient(90deg,#16a34a,#4ade80)" : result.confidence >= 45 ? "linear-gradient(90deg,#d97706,#fbbf24)" : "linear-gradient(90deg,#b91c1c,#f87171)" }} />
                        </div>
                        <b className="t-num">{result.confidence}%</b>
                      </div>
                      {cutOff && <p className="ended__cut">The line dropped just as {friend.first} blurted out the answer!</p>}
                    </div>
                    <Button
                      variant="gold"
                      iconRight={ArrowRight}
                      onClick={() => onClose({ friend: { id: friend.id, first: friend.first, avatar: friend.avatar }, index: result.index, confidence: result.confidence })}
                    >
                      Back to the game
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="phone__home" />
          </div>
        </div>
      </div>
    </Modal>
  );
}

function CallBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button type="button" className={`call__btn${active ? " is-active" : ""}`} onClick={onClick} tabIndex={onClick ? 0 : -1}>
      <span className="call__btn-icon">
        <Icon size={20} />
      </span>
      <span className="call__btn-label">{label}</span>
    </button>
  );
}

// A caption line that types itself out.
function Caption({ line, friend, active }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const speed = line.who === "you" ? 16 : 26;
    const id = setInterval(() => setN((x) => (x >= line.text.length ? (clearInterval(id), x) : x + 1)), speed);
    return () => clearInterval(id);
  }, [line]);
  return (
    <motion.div className={`caption caption--${line.who}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <span className="caption__who">{line.who === "you" ? "You" : friend.first}</span>
      <span className="caption__text">
        {line.text.slice(0, n)}
        {n < line.text.length && <span className="caption__caret" />}
      </span>
      {active && line.who === "friend" && (
        <span className="caption__wave" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${i * 0.11}s` }} />
          ))}
        </span>
      )}
    </motion.div>
  );
}
