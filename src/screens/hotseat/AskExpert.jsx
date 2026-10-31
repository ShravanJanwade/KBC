import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, ArrowRight, Signal } from "lucide-react";
import Avatar from "../../components/Avatar";
import { Modal, Button } from "../../components/ui";
import { EXPERT } from "../../data/people";
import { expertAnswer } from "../../engine/lifelines";
import { useSequencer } from "../../hooks/useSequencer";
import { say, cancelSpeech } from "../../audio/speech";
import { audio } from "../../audio/engine";
import { sfx } from "../../audio/synth";
import { LETTERS } from "../../lib/format";
import { pick } from "../../lib/random";

function speechFor(q, res) {
  const L = LETTERS[res.index];
  const text = q.options[res.index];
  if (res.knows) {
    const open = pick(["I'm quite confident about this one.", "Ah, this is a classic.", "I know this one well."]);
    return `${open} The answer is ${L} — ${text}. ${q.f}`;
  }
  const hedge = pick(["I can't place the exact fact,", "I'm torn between a couple of options,", "This is genuinely tricky,"]);
  return `${hedge} but my instinct says ${L} — ${text}. Please treat it as a hint, not a certainty.`;
}

export default function AskExpert({ q, removed, voice, onClose }) {
  const res = useMemo(() => expertAnswer(EXPERT, { answer: q.answer, d: q.d, removed }), [q, removed]);
  const speech = useMemo(() => speechFor(q, res), [q, res]);
  const [stage, setStage] = useState("connecting");
  const [typed, setTyped] = useState(0);
  const { run } = useSequencer();

  useEffect(() => {
    audio.stopMusic(0.6);
    run(async (wait) => {
      sfx.dtmf(1);
      await wait(250);
      sfx.dtmf(9);
      await wait(1300);
      sfx.pickup();
      setStage("thinking");
      await wait(2200);
      setStage("speaking");
      const typing = new Promise((resolve) => {
        let n = 0;
        const id = setInterval(() => {
          n++;
          setTyped(n);
          if (n >= speech.length) {
            clearInterval(id);
            resolve();
          }
        }, 28);
      });
      await Promise.all([typing, voice ? say(speech, EXPERT.voice) : Promise.resolve()]);
      await wait(300);
      setStage("done");
      sfx.ding();
    });
    return () => cancelSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const conf = res.confidence;
  const gaugeColor = conf >= 80 ? "#2fdc72" : conf >= 60 ? "#ffb020" : "#ff4d5e";
  const arc = Math.PI * 70;

  return (
    <Modal open size="lg" dismissible={false} label="Ask the expert">
      <div className="expert glass glass--gold">
        <header className="ll-head">
          <span className="ll-head__icon">
            <GraduationCap size={22} />
          </span>
          <div>
            <div className="eyebrow">Lifeline</div>
            <h2 className="ll-head__title">Ask the Expert</h2>
            <div className="ll-head__sub t-hi">विशेषज्ञ की सलाह</div>
          </div>
        </header>

        <div className="expert__body">
          <div className="expert__video">
            <div className="expert__studio" aria-hidden="true">
              {Array.from({ length: 9 }, (_, i) => (
                <span key={i} style={{ left: `${8 + i * 11}%`, top: `${12 + ((i * 37) % 50)}%`, animationDelay: `${i * 0.4}s` }} />
              ))}
            </div>
            <motion.div className="expert__portrait" animate={stage === "speaking" ? { y: [0, -2, 0] } : { y: 0 }} transition={{ duration: 0.6, repeat: stage === "speaking" ? Infinity : 0 }}>
              <Avatar config={EXPERT.avatar} size={170} />
            </motion.div>
            <div className="expert__live">
              <span /> LIVE
            </div>
            <div className="expert__signal">
              <Signal size={14} /> HD
            </div>
            <div className="expert__plate">
              <div className="expert__name">{EXPERT.name}</div>
              <div className="expert__title">{EXPERT.title}</div>
            </div>
            {stage === "connecting" && (
              <div className="expert__connecting">
                <span className="spinner" /> Connecting to the expert panel…
              </div>
            )}
          </div>

          <div className="expert__panel">
            <div className="expert__status">
              {stage === "connecting" && "Establishing video link…"}
              {stage === "thinking" && (
                <span className="thinking">
                  Reading the question<span className="thinking__dots" />
                </span>
              )}
              {(stage === "speaking" || stage === "done") && "Expert's view"}
            </div>
            <div className="expert__speech">
              {stage === "thinking" && (
                <div className="shimmer">
                  <span />
                  <span />
                  <span />
                </div>
              )}
              {(stage === "speaking" || stage === "done") && (
                <p>
                  “{speech.slice(0, typed)}
                  {stage === "speaking" && <span className="caption__caret" />}
                  {stage === "done" && "”"}
                </p>
              )}
            </div>
            {stage === "done" && (
              <motion.div className="expert__verdict" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                <div>
                  <div className="eyebrow">Expert suggests</div>
                  <div className="expert__answer">
                    <span className="ended__letter t-num">{LETTERS[res.index]}</span> {q.options[res.index]}
                  </div>
                </div>
                <svg viewBox="0 0 160 92" className="gauge" aria-label={`Confidence ${conf}%`}>
                  <path d="M10 82 A70 70 0 0 1 150 82" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="12" strokeLinecap="round" />
                  <motion.path
                    d="M10 82 A70 70 0 0 1 150 82"
                    fill="none"
                    stroke={gaugeColor}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={arc}
                    initial={{ strokeDashoffset: arc }}
                    animate={{ strokeDashoffset: arc * (1 - conf / 100) }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <text x="80" y="74" textAnchor="middle" className="gauge__num">
                    {conf}%
                  </text>
                  <text x="80" y="90" textAnchor="middle" className="gauge__label">
                    confidence
                  </text>
                </svg>
              </motion.div>
            )}
          </div>
        </div>

        <footer className="ll-foot">
          <p className="ll-foot__note">Experts are usually right — but not always on the toughest questions.</p>
          <Button variant="gold" iconRight={ArrowRight} disabled={stage !== "done"} onClick={() => onClose({ index: res.index, confidence: res.confidence })}>
            Back to the game
          </Button>
        </footer>
      </div>
    </Modal>
  );
}
