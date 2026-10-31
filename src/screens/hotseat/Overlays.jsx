import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, X, RefreshCcw, Lightbulb, GraduationCap, LogOut, Play, Crown, SkipForward } from "lucide-react";
import Avatar from "../../components/Avatar";
import Celebration from "../../components/Celebration";
import { Modal, Button, Toggle, Range, AnimatedMoney } from "../../components/ui";
import { audio } from "../../audio/engine";
import { sfx } from "../../audio/synth";
import { LETTERS, formatINR } from "../../lib/format";
import { amountFor, safeAmount } from "../../data/prizes";

export function MilestoneOverlay({ level, onDone }) {
  const amount = amountFor(level);
  useEffect(() => {
    sfx.gong();
    sfx.applause(2.6, 0.55);
    const t = setTimeout(onDone, 4600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return createPortal(
    <motion.div className="moment" onClick={onDone} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Celebration modes={["coins", "confetti"]} duration={2600} intensity={0.75} />
      <motion.div className="moment__halo" initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
      <motion.div className="moment__eyebrow" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
        {level === 5 ? "Pehla Padaav · First milestone" : "Doosra Padaav · Second milestone"}
      </motion.div>
      <motion.div className="moment__title t-display t-gold" initial={{ scale: 2.4, opacity: 0, filter: "blur(12px)" }} animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }} transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
        {formatINR(amount)}
      </motion.div>
      <motion.div className="moment__sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
        Guaranteed! Ab yeh rakam aapse koi nahi chheen sakta.
      </motion.div>
      {level === 5 && (
        <motion.div className="moment__unlock" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.4, type: "spring" }}>
          <RefreshCcw size={18} /> New lifeline unlocked: <b>Flip the Question</b>
        </motion.div>
      )}
      <div className="moment__tap">Tap anywhere to continue</div>
    </motion.div>,
    document.body
  );
}

// Big win: ₹1 crore (level 15) or the ₹7 crore jackpot (level 16).
export function BigWinOverlay({ jackpot, name, onDone }) {
  useEffect(() => {
    audio.play("winner");
    sfx.fanfare();
    sfx.applause(jackpot ? 7 : 5, 0.9);
    const t = setTimeout(() => sfx.fanfare(), 1600);
    return () => clearTimeout(t);
  }, [jackpot]);
  return createPortal(
    <motion.div className="moment moment--big" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Celebration modes={["fireworks", "confetti", "coins"]} duration={jackpot ? 9000 : 6500} intensity={jackpot ? 1.4 : 1} />
      <motion.div className="moment__halo moment__halo--gold" initial={{ scale: 0.2, opacity: 0 }} animate={{ scale: 1.15, opacity: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
      <motion.div className="moment__crown" initial={{ y: -40, opacity: 0, rotate: -20 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ delay: 0.4, type: "spring", stiffness: 160 }}>
        <Crown size={56} />
      </motion.div>
      <motion.div className="moment__title moment__title--xl t-display t-gold" initial={{ scale: 3, opacity: 0, letterSpacing: "0.5em" }} animate={{ scale: 1, opacity: 1, letterSpacing: "0.06em" }} transition={{ delay: 0.5, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}>
        {jackpot ? "₹7 CRORE!" : "CROREPATI!"}
      </motion.div>
      <motion.div className="moment__sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
        {jackpot ? `${name}, aapne itihaas rach diya! You've won the jackpot.` : `${name}, aap ban gaye hain Crorepati! ₹1,00,00,000 is yours.`}
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.4 }}>
        <Button variant="gold" size="lg" iconRight={ArrowRight} onClick={onDone}>
          {jackpot ? "Collect your cheque" : "Continue"}
        </Button>
      </motion.div>
    </motion.div>,
    document.body
  );
}

export function JackpotDialog({ onPlay, onWalk }) {
  return (
    <Modal open size="md" dismissible={false} label="Jackpot decision">
      <div className="dialog glass glass--gold">
        <div className="eyebrow">The ₹7 crore question</div>
        <h2 className="dialog__title t-gold">Saat Crore ka Sawaal?</h2>
        <p className="dialog__text">
          You've already won <b className="t-gold">₹1 Crore</b>. Play the jackpot question and a wrong answer drops you to <b>{formatINR(safeAmount(16))}</b>. Walk away now and the crore is yours to keep.
        </p>
        <div className="dialog__actions">
          <Button variant="glass" size="lg" icon={LogOut} onClick={onWalk}>
            Take ₹1 Crore home
          </Button>
          <Button variant="gold" size="lg" icon={Play} onClick={onPlay}>
            Play for ₹7 Crore
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function QuitDialog({ amount, onConfirm, onCancel }) {
  return (
    <Modal open size="sm" onClose={onCancel} label="Walk away">
      <div className="dialog glass glass--gold">
        <div className="eyebrow">Walk away</div>
        <h2 className="dialog__title">Khel chhodna hai?</h2>
        <p className="dialog__text">
          You'll leave with <b className="t-gold">{formatINR(amount)}</b>. You can still tell us what you would have answered — just for fun.
        </p>
        <div className="dialog__actions">
          <Button variant="glass" icon={X} onClick={onCancel}>
            Keep playing
          </Button>
          <Button variant="gold" icon={Check} onClick={onConfirm}>
            Walk away
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function PauseDialog({ settings, updateSettings, canQuit, onResume, onQuit }) {
  return (
    <Modal open size="sm" onClose={onResume} label="Paused">
      <div className="dialog glass glass--gold pause">
        <h2 className="dialog__title">Paused</h2>
        <p className="dialog__text">The clock has stopped. Take a breather.</p>
        <div className="pause__rows">
          <label className="pause__row">
            <span>Music</span>
            <Range value={settings.music} onChange={(music) => updateSettings({ music })} label="Music volume" />
          </label>
          <label className="pause__row">
            <span>Effects</span>
            <Range value={settings.sfx} onChange={(v) => updateSettings({ sfx: v })} onCommit={() => sfx.coin()} label="Effects volume" />
          </label>
          <div className="pause__row">
            <span>Host voice</span>
            <Toggle checked={settings.hostVoice} onChange={(hostVoice) => updateSettings({ hostVoice })} label="Host voice" />
          </div>
          <div className="pause__row">
            <span>Lifeline voices</span>
            <Toggle checked={settings.lifelineVoice} onChange={(lifelineVoice) => updateSettings({ lifelineVoice })} label="Lifeline voices" />
          </div>
        </div>
        <div className="dialog__actions">
          {canQuit && (
            <Button variant="glass" icon={LogOut} onClick={onQuit}>
              Walk away
            </Button>
          )}
          <Button variant="gold" icon={Play} onClick={onResume}>
            Resume
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function HintsDock({ hints }) {
  const visible = hints.filter((h) => h.type !== "fifty");
  return (
    <div className="hints" aria-label="Lifeline results">
      <AnimatePresence>
        {visible.map((h) => (
          <motion.div key={h.type} className="hint glass" initial={{ opacity: 0, x: -24, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0 }}>
            {h.type === "poll" && (
              <div className="hint__poll" aria-label="Audience poll result">
                {h.shares.map((s, i) => (
                  <div key={i} className="hint__pcol">
                    <div className="hint__pbar">
                      <span style={{ height: `${s}%` }} />
                    </div>
                    <div className="hint__plabel t-num">
                      {LETTERS[i]} <small>{s}%</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {h.type === "phone" && (
              <div className="hint__row">
                <Avatar config={h.friend.avatar} size={30} />
                <span>
                  {h.friend.first} says <b className="t-num">{LETTERS[h.index]}</b> <small>· {h.confidence}%</small>
                </span>
              </div>
            )}
            {h.type === "expert" && (
              <div className="hint__row">
                <span className="hint__icon">
                  <GraduationCap size={16} />
                </span>
                <span>
                  Expert says <b className="t-num">{LETTERS[h.index]}</b> <small>· {h.confidence}%</small>
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const HEADLINES = {
  wrong: { title: "Galat Jawab", sub: "Wrong answer" },
  timeout: { title: "Samay Samaapt", sub: "Time's up" },
  walked: { title: "Khel Samaapt", sub: "You walked away" },
};

export function RevealPanel({ phase, q, amount, onNext, nextLabel, guessRight }) {
  const head = HEADLINES[phase];
  return (
    <motion.div className={`reveal reveal--${phase} glass`} initial={{ opacity: 0, y: 24, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, transition: { duration: 0.2 } }} transition={{ type: "spring", stiffness: 260, damping: 24 }}>
      {phase === "correct" ? (
        <div className="reveal__amount">
          <span className="eyebrow">Aap jeet chuke hain</span>
          <AnimatedMoney value={amount} className="reveal__money t-display t-gold" />
        </div>
      ) : (
        <div className="reveal__head">
          <div className="reveal__title t-display">{head.title}</div>
          <div className="reveal__sub">
            {head.sub}
            {phase === "walked" && guessRight != null && (guessRight ? " — and your guess was right!" : " — a wise call, your guess was wrong.")}
          </div>
        </div>
      )}
      <div className="reveal__fact">
        <Lightbulb size={18} className="reveal__bulb" />
        <span>
          <b>Did you know?</b> {q.f}
        </span>
      </div>
      <Button variant={phase === "correct" ? "gold" : "glass"} iconRight={ArrowRight} onClick={onNext} autoFocus>
        {nextLabel}
      </Button>
    </motion.div>
  );
}

export function ConfirmBar({ letter, text, onLock, onCancel }) {
  return (
    <motion.div className="confirm glass glass--gold" initial={{ opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}>
      <div className="confirm__q">
        <span className="confirm__eyebrow">Lock kiya jaye?</span>
        <span className="confirm__ans">
          <b className="t-num">{letter}:</b> {text}
        </span>
      </div>
      <div className="confirm__actions">
        <Button variant="glass" size="sm" icon={X} onClick={onCancel}>
          Change <span className="kbd">Esc</span>
        </Button>
        <Button variant="gold" size="sm" icon={Check} onClick={onLock}>
          Lock it <span className="kbd">Enter</span>
        </Button>
      </div>
    </motion.div>
  );
}

export function GuessBar({ onSkip }) {
  return (
    <motion.div className="confirm glass" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="confirm__q">
        <span className="confirm__eyebrow">Just for fun</span>
        <span className="confirm__ans">Which answer would you have locked?</span>
      </div>
      <Button variant="glass" size="sm" icon={SkipForward} onClick={onSkip}>
        Skip
      </Button>
    </motion.div>
  );
}
