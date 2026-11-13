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
import { host } from "../../data/host";
import { friendAnswer } from "../../engine/lifelines";
import { useSequencer } from "../../hooks/useSequencer";
import { audio } from "../../audio/engine";
import { sfx } from "../../audio/synth";
import { speakLine, speakEnglish, cancelSpeech, hostWho, speechSupported } from "../../audio/speech";
import { LETTERS, formatClock, shortINR } from "../../lib/format";
import { pick } from "../../lib/random";

const CALL_SECONDS = 30;
const HI_LETTER = { A: "ए", B: "बी", C: "सी", D: "डी" };
const T = (text, hi, en) => ({ text, hi, en });

// What the friend says, in their own style (Dadi calls you "beta", Rohit calls you "bhai").
function friendLines(friend, q, res) {
  const L = LETTERS[res.index];
  const HL = HI_LETTER[L];
  const opt = q.options[res.index];
  const c = res.confidence;
  const style = friend.id === "dadi" ? "beta" : friend.id === "rohit" ? "bhai" : "plain";

  const think = {
    sure:
      style === "beta"
        ? T("Haan beta... yeh toh hum jaante hain.", "हाँ बेटा... ये तो हम जानते हैं।", "Yes dear... I know this one.")
        : pick([T("Arre, yeh toh mujhe pata hai!", "अरे, ये तो मुझे पता है!", "Oh, I know this one!"), T("Haan haan, yaad hai mujhe...", "हाँ हाँ, याद है मुझे...", "Yes, yes, I remember this...")]),
    unsure: pick([T("Hmm... ek minute... sochne do...", "हम्म... एक मिनट... सोचने दो...", "Hmm... one minute... let me think..."), T("Kahin padha tha maine... ruko...", "कहीं पढ़ा था मैंने... रुको...", "I've read about this somewhere... wait...")]),
    clueless: pick([T("Arre yaar... yeh toh bahut mushkil hai...", "अरे यार... ये तो बहुत मुश्किल है...", "Oh no... this one is really tough..."), T("Sach kahoon toh... pata nahi...", "सच कहूँ तो... पता नहीं...", "Honestly... I'm not sure...")]),
  }[res.mood];

  const answer = {
    sure:
      style === "beta"
        ? T(`Beta, ${L} hai... ${opt}. Dadi pe bharosa rakho!`, `बेटा, ${HL} है... ${opt}। दादी पे भरोसा रखो!`, `Dear, it's ${L}... ${opt}. Trust your Dadi!`)
        : style === "bhai"
          ? T(`Bhai, ${L} hai... ${opt}! ${c} percent pakka, lock kar!`, `भाई, ${HL} है... ${opt}! ${c} प्रतिशत पक्का, लॉक कर!`, `Bro, it's ${L}... ${opt}! ${c} percent sure, lock it!`)
          : T(`It's ${L}... ${opt}. I'm ${c} percent sure. Lock it!`, `${HL} है... ${opt}। ${c} प्रतिशत पक्का। लॉक कर दो!`, `It's ${L}... ${opt}. I'm ${c} percent sure. Lock it!`),
    unsure: T(`Mujhe lagta hai ${L}... ${opt}. Shayad ${c} percent. Sirf mere bharose mat rehna.`, `मुझे लगता है ${HL}... ${opt}। शायद ${c} प्रतिशत। सिर्फ़ मेरे भरोसे मत रहना।`, `I think it's ${L}... ${opt}. Maybe ${c} percent. Don't go only by me.`),
    clueless: T(`Agar guess karna ho toh ${L}... ${opt}. Bas ${c} percent. Dhyaan se!`, `अगर अंदाज़ा लगाना हो तो ${HL}... ${opt}। बस ${c} प्रतिशत। ध्यान से!`, `If I had to guess... ${L}, ${opt}. Only ${c} percent. Be careful!`),
  }[res.mood];

  const bye =
    style === "beta"
      ? T("Jeet ke aana beta, Dadi aashirwad de rahi hai!", "जीत के आना बेटा, दादी आशीर्वाद दे रही है!", "Win it, dear. Dadi's blessings are with you!")
      : res.mood === "sure"
        ? pick([T("All the best! Jeet ke aana!", "ऑल द बेस्ट! जीत के आना!", "All the best! Come back a winner!"), T("Jao, jeet lo! Party pakki!", "जाओ, जीत लो! पार्टी पक्की!", "Go win it! Party's on you!")])
        : pick([T("Sorry yaar, isse zyada nahi pata. All the best!", "सॉरी यार, इससे ज़्यादा नहीं पता। ऑल द बेस्ट!", "Sorry, that's all I know. All the best!"), T("Apne dil ki suno. Best of luck!", "अपने दिल की सुनो। बेस्ट ऑफ़ लक!", "Trust your gut. Best of luck!")]);

  // When the clock is nearly out the friend just blurts it out.
  const quick =
    style === "beta"
      ? T(`${L}, beta! ${opt}!`, `${HL}, बेटा! ${opt}!`, `${L}, dear! ${opt}!`)
      : T(`${L}! ${opt}! ${res.mood === "sure" ? "Pakka!" : "Shayad!"}`, `${HL}! ${opt}! ${res.mood === "sure" ? "पक्का!" : "शायद!"}`, `${L}! ${opt}! ${res.mood === "sure" ? "Sure!" : "Maybe!"}`);

  return { think, answer, bye, quick };
}

const prettyNumber = (digits) => {
  const d = digits.padEnd(10, " ");
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`.trimEnd();
};

export default function PhoneAFriend({ q, removed, level, settings, playerName, onClose }) {
  const [stage, setStage] = useState("contacts");
  const [friend, setFriend] = useState(null);
  const [result, setResult] = useState(null);
  const [dialed, setDialed] = useState("");
  const [lines, setLines] = useState([]);
  const [speaking, setSpeaking] = useState(null);
  const [clockOn, setClockOn] = useState(false);
  const [left, setLeft] = useState(CALL_SECONDS);
  const [callStart, setCallStart] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [cutOff, setCutOff] = useState(false);
  const [muted, setMuted] = useState(false);
  const revealedRef = useRef(false);
  const endedRef = useRef(false);
  const stopRing = useRef(null);
  const stopLine = useRef(null);
  const { run, cancel } = useSequencer();
  const cat = CATEGORY_BY_ID[q.c];
  const clock = useMemo(() => new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: false }), []);
  const voices = settings.lifelineVoice && speechSupported;
  const hostVoice = settings.hostVoice && speechSupported;
  const lang = settings.language;

  const hangUp = (timedOut) => {
    if (endedRef.current) return;
    endedRef.current = true;
    cancel();
    cancelSpeech();
    stopRing.current?.();
    stopRing.current = null;
    stopLine.current?.();
    stopLine.current = null;
    audio.stopMusic(0.4);
    sfx.hangup();
    setSpeaking(null);
    setClockOn(false);
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
      stopLine.current?.();
      cancelSpeech();
    },
    []
  );

  // Call duration shown on the phone (from pick-up).
  useEffect(() => {
    if (!callStart || stage !== "connected") return;
    const id = setInterval(() => setElapsed((performance.now() - callStart) / 1000), 250);
    return () => clearInterval(id);
  }, [callStart, stage]);

  // The KBC 30-second clock runs once the host has introduced the call.
  useEffect(() => {
    if (!clockOn) return;
    const start = performance.now();
    const id = setInterval(() => {
      const l = Math.max(0, CALL_SECONDS - (performance.now() - start) / 1000);
      setLeft(l);
      if (l <= 0) {
        clearInterval(id);
        // An answer already on its way gets a moment to finish before the line drops.
        if (revealedRef.current) setTimeout(() => hangUpRef.current(false), 2600);
        else hangUpRef.current(true);
      }
    }, 100);
    return () => clearInterval(id);
  }, [clockOn]);

  // A spoken line: shows a caption, speaks it (or waits a reading-time equivalent), then pauses.
  const deliver = async (wait, caption, speakFn, minMs) => {
    setLines((ls) => [...ls, caption]);
    setSpeaking(caption.who);
    if (speakFn) await Promise.all([speakFn(), wait(Math.min(minMs, 1200))]);
    else await wait(minMs);
    setSpeaking(null);
    await wait(260);
  };

  const call = (f) => {
    sfx.click();
    cancelSpeech();
    const res = friendAnswer(f, { answer: q.answer, d: q.d, c: q.c, removed });
    const fl = friendLines(f, q, res);
    const who = { ...f.voice };
    const showFriend = (line) => (f.voice.hindi && lang !== "english" ? line.text : line.en);
    const sayFriend = (line) => (voices ? () => speakLine(line, who, { language: lang }) : null);
    const options = [0, 1, 2, 3].filter((i) => !removed.includes(i));
    const questionText = `${q.q}  ${options.map((i) => `${LETTERS[i]}: ${q.options[i]}`).join("  ·  ")}`;
    // One quick breath: per-phrase pauses would eat into the friend's 30 seconds.
    const questionSpeech = `${q.q} ${options.map((i) => `${LETTERS[i]}: ${q.options[i]}.`).join(" ")}`;
    const intro = host.lifeline.phoneToFriend(f.first, playerName);

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
      stopLine.current = sfx.phoneLine();
      setStage("connected");
      setCallStart(performance.now());
      audio.music("phone", { fade: 0.8, volume: 0.22 });
      await wait(500);

      // The host introduces the call; the clock starts on "...ab!"
      await deliver(wait, { who: "host", text: lang === "english" ? intro.en : intro.text }, hostVoice ? () => speakLine(intro, hostWho(), { language: lang }) : null, 4200);
      setClockOn(true);
      const deadline = performance.now() + CALL_SECONDS * 1000;
      const secondsLeft = () => (deadline - performance.now()) / 1000;
      await deliver(wait, { who: "friend", text: showFriend(f.greeting) }, sayFriend(f.greeting), 1800);
      await deliver(wait, { who: "host", text: questionText }, hostVoice ? () => speakEnglish(questionSpeech, { ...hostWho(), rate: 1.22 }) : null, Math.max(3500, questionText.length * 28));
      // Whatever happens, the friend's answer must land inside the 30 seconds.
      if (secondsLeft() > 12) await deliver(wait, { who: "friend", text: showFriend(fl.think) }, sayFriend(fl.think), 1500);
      revealedRef.current = true;
      setRevealed(true);
      const answer = secondsLeft() > 7 ? fl.answer : fl.quick;
      await deliver(wait, { who: "friend", text: showFriend(answer), isAnswer: true }, sayFriend(answer), 2400);
      if (secondsLeft() > 3.5) await deliver(wait, { who: "friend", text: showFriend(fl.bye) }, sayFriend(fl.bye), 1500);
      await wait(600);
      hangUpRef.current(false);
    });
  };

  const [bg1, bg2] = BACKGROUNDS[friend?.avatar.bg ?? 0];
  const phase = stage === "connected" ? (clockOn ? "live" : "intro") : stage;

  return (
    <Modal open size="full" dismissible={false} label="Phone a friend" className="paf-modal">
      <div className="paf">
        <aside className="paf__side">
          <div className="eyebrow">Lifeline · Phone a Friend</div>
          <Timer total={CALL_SECONDS} left={left} paused={!clockOn && stage !== "ended"} size={150} />
          <p className="paf__clock-note">
            {phase === "live" ? "30 seconds on the clock" : stage === "ended" ? "Call finished" : phase === "intro" ? "The host is introducing your call…" : "The clock starts once your friend is on the line"}
          </p>
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
                            <span className="call__hd">HD</span> {formatClock(elapsed)}
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
                    <div className="ended__time t-num">{formatClock(elapsed)}</div>
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
                          <span
                            style={{
                              width: `${result.confidence}%`,
                              background: result.confidence >= 70 ? "linear-gradient(90deg,#16a34a,#4ade80)" : result.confidence >= 45 ? "linear-gradient(90deg,#d97706,#fbbf24)" : "linear-gradient(90deg,#b91c1c,#f87171)",
                            }}
                          />
                        </div>
                        <b className="t-num">{result.confidence}%</b>
                      </div>
                      {cutOff && <p className="ended__cut">The line dropped just as {friend.first} blurted out the answer!</p>}
                    </div>
                    <Button
                      variant="gold"
                      iconRight={ArrowRight}
                      autoFocus
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
    const speed = line.who === "host" ? 22 : 30;
    const id = setInterval(() => setN((x) => (x >= line.text.length ? (clearInterval(id), x) : x + 1)), speed);
    return () => clearInterval(id);
  }, [line]);
  return (
    <motion.div className={`caption caption--${line.who}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <span className="caption__who">{line.who === "host" ? "Host · KBC" : friend.first}</span>
      <span className="caption__text">
        {line.text.slice(0, n)}
        {n < line.text.length && <span className="caption__caret" />}
      </span>
      {active && (
        <span className="caption__wave" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${i * 0.11}s` }} />
          ))}
        </span>
      )}
    </motion.div>
  );
}
