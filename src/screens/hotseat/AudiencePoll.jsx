import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Users, ArrowRight } from "lucide-react";
import { Modal, Button } from "../../components/ui";
import { audiencePoll } from "../../engine/lifelines";
import { audio } from "../../audio/engine";
import { sfx } from "../../audio/synth";
import { LETTERS } from "../../lib/format";
import { host, lineText } from "../../data/host";
import { speakLine, hostWho } from "../../audio/speech";

const VOTE_MS = 7500;
const SEATS = 84;

export default function AudiencePoll({ q, removed, settings, onClose }) {
  const result = useMemo(() => audiencePoll({ answer: q.answer, d: q.d, removed }), [q, removed]);
  const [done, setDone] = useState(false);
  const [bars, setBars] = useState([0, 0, 0, 0]);
  const [left, setLeft] = useState(Math.ceil(VOTE_MS / 1000));
  const [lit, setLit] = useState(() => new Set());
  const [comment, setComment] = useState(null);
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    setBars(result);
    setDone(true);
    setLit(new Set());
    audio.stopMusic(0.8);
    sfx.ding();
    sfx.applause(2, 0.45);
    const line = host.lifeline.pollResult(Math.max(...result));
    setComment(line);
    if (settings?.hostVoice) setTimeout(() => speakLine(line, hostWho(), { language: settings.language }), 700);
  };

  useEffect(() => {
    audio.music("audience", { fade: 0.3 });
    const jitter = setInterval(() => {
      if (finished.current) return;
      setBars(
        [0, 1, 2, 3].map((i) => (removed.includes(i) ? 0 : Math.round(8 + Math.random() * 30 + (Math.random() < 0.3 ? 25 : 0))))
      );
      setLit(new Set(Array.from({ length: 14 }, () => Math.floor(Math.random() * SEATS))));
      if (Math.random() < 0.6) sfx.keypad();
    }, 170);
    const count = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    const t = setTimeout(() => {
      clearInterval(jitter);
      clearInterval(count);
      finish();
    }, VOTE_MS);
    return () => {
      clearInterval(jitter);
      clearInterval(count);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const top = Math.max(...result);

  return (
    <Modal open size="lg" dismissible={false} label="Audience poll">
      <div className="poll glass glass--gold">
        <header className="ll-head">
          <span className="ll-head__icon">
            <Users size={22} />
          </span>
          <div>
            <div className="eyebrow">Lifeline</div>
            <h2 className="ll-head__title">Audience Poll</h2>
            <div className="ll-head__sub t-hi">दर्शकों की राय</div>
          </div>
          <div className={`poll__status${done ? " is-done" : ""}`}>{done ? "Voting closed" : `Audience voting… ${left}s`}</div>
        </header>

        <div className="poll__screen">
          <div className="poll__grid" aria-hidden="true" />
          {[0, 1, 2, 3].map((i) => {
            const v = bars[i];
            const gone = removed.includes(i);
            const winner = done && v === top && v > 0;
            return (
              <div key={i} className={`poll__col${gone ? " is-gone" : ""}${winner ? " is-top" : ""}`}>
                <div className="poll__pct t-num">{gone ? "—" : `${v}%`}</div>
                <div className="poll__track">
                  <motion.div className="poll__bar" animate={{ height: `${gone ? 0 : v}%` }} transition={done ? { type: "spring", stiffness: 120, damping: 14 } : { duration: 0.16 }} />
                </div>
                <div className="poll__letter t-num">{LETTERS[i]}</div>
                <div className="poll__opt">{gone ? "" : q.options[i]}</div>
              </div>
            );
          })}
        </div>

        <div className="poll__audience" aria-hidden="true">
          {Array.from({ length: SEATS }, (_, i) => (
            <span key={i} className={lit.has(i) ? "is-lit" : ""} />
          ))}
        </div>

        <footer className="ll-foot">
          <p className="ll-foot__note">{done && comment ? <><b className="t-gold">Host:</b> {lineText(comment, settings?.language)}</> : done ? "The audience has spoken — but the final decision is yours." : "Studio audience members are voting on their keypads…"}</p>
          {done ? (
            <Button variant="gold" iconRight={ArrowRight} onClick={() => onClose({ shares: result })}>
              Back to the game
            </Button>
          ) : (
            <Button variant="glass" size="sm" onClick={finish}>
              Show result now
            </Button>
          )}
        </footer>
      </div>
    </Modal>
  );
}
