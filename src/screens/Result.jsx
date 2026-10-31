import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Home, History as HistoryIcon, Brain, Trophy, Timer, Target, Sparkles, TrendingUp, TrendingDown, Lightbulb } from "lucide-react";
import Cheque from "../components/Cheque";
import Celebration from "../components/Celebration";
import QuestionRecap from "../components/QuestionRecap";
import { Button, AnimatedMoney, ProgressBar } from "../components/ui";
import { NamedIcon, LifelineGlyph } from "../components/icons";
import { useStageMood } from "../components/Stage";
import { useToasts } from "../components/Toasts";
import { useApp } from "../state/AppContext";
import { ACHIEVEMENTS } from "../data/achievements";
import { CATEGORY_BY_ID } from "../data/categories";
import { tierOf } from "../engine/rating";
import { audio } from "../audio/engine";
import { sfx } from "../audio/synth";
import { formatDuration } from "../lib/format";
import "../styles/pages.css";

const ACH = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

function headline(game) {
  if (game.outcome === "won") return { title: "SAAT CRORE!", sub: "The jackpot is yours. Itihaas rach diya!" };
  if (game.prize >= 1e7) return { title: "CROREPATI!", sub: "You walk away with one crore rupees." };
  if (game.prize >= 320000) return { title: "Shandaar Khel!", sub: "A brilliant run on the hot seat." };
  if (game.prize > 0) return { title: game.outcome === "walked" ? "Sahi Faisla" : "Achha Khele!", sub: game.outcome === "walked" ? "You played it smart and walked away." : "Well played — you leave with a cheque." };
  return { title: "Koi Baat Nahi", sub: "Every champion was once a beginner. Agli baar!" };
}

export default function Result({ game, unlocked = [], onPlayAgain, onMenu, onHistory }) {
  const { profile } = useApp();
  const { push } = useToasts();
  const big = game.prize >= 1e7;
  useStageMood(big ? "celebrate" : game.prize >= 320000 ? "menu" : "calm");

  useEffect(() => {
    if (big) {
      audio.play("winner");
      sfx.fanfare();
      sfx.applause(5, 0.8);
      audio.music("theme", { fade: 2 });
    } else {
      audio.music("outro", { fade: 0.6 });
      if (game.prize > 0) sfx.applause(2.6, 0.55);
    }
    const timers = unlocked.map((id, i) =>
      setTimeout(() => {
        const a = ACH[id];
        if (a) push({ title: a.name, desc: a.desc, icon: a.icon });
      }, 1800 + i * 1100)
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const head = headline(game);
  const answered = game.questions.filter((q) => !q.flipped && (q.chosen != null || q.timedOut));
  const times = answered.filter((q) => q.chosen != null).map((q) => q.timeMs);
  const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  const fastest = times.length ? Math.min(...times) : 0;
  const delta = game.iqAfter - game.iqBefore;
  const tier = tierOf(game.iqAfter);
  const usedLifelines = Object.keys(game.lifelines || {});

  const tip = useMemo(() => {
    const wrong = game.questions.find((q) => !q.flipped && q.correct === false);
    if (game.outcome === "timeout") return "Running low on time? Lifelines pause the clock — use one to think.";
    if (wrong && !usedLifelines.length) return "You finished with lifelines unused. They're there to be used — especially before a padaav.";
    if (wrong) return `Tough luck on ${CATEGORY_BY_ID[wrong.c]?.name}. Raise it on the Topics screen if you want more practice there.`;
    return "Walking away at the right moment is a skill too.";
  }, [game, usedLifelines.length]);

  return (
    <div className="page result">
      {game.prize > 0 && <Celebration modes={big ? ["fireworks", "confetti", "coins"] : game.prize >= 320000 ? ["confetti", "coins"] : ["confetti"]} duration={big ? 8000 : 3500} intensity={big ? 1.2 : 0.7} />}

      <motion.header className="result__head" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="eyebrow">{game.outcome === "wrong" ? "Wrong answer" : game.outcome === "timeout" ? "Time's up" : game.outcome === "walked" ? "Walked away" : "Jackpot"} · Question {game.level} of 16</div>
        <h1 className="result__title t-display t-gold">{head.title}</h1>
        <p className="result__sub">{head.sub}</p>
      </motion.header>

      <div className="result__body scroll">
        <div className="result__grid">
          <div className="result__prize">
            {game.prize > 0 ? (
              <Cheque name={profile?.name ?? "Player"} amount={game.prize} date={game.endedAt} />
            ) : (
              <motion.div className="result__zero glass" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
                <div className="result__zero-amt t-display">₹0</div>
                <p>No cheque this time — the first padaav is at ₹10,000.</p>
              </motion.div>
            )}
            <div className="result__tip card">
              <Lightbulb size={18} className="reveal__bulb" />
              <span>{tip}</span>
            </div>
          </div>

          <div className="result__stats">
            <div className="result__money card">
              <span className="eyebrow">You take home</span>
              <AnimatedMoney value={game.prize} duration={2} className="result__money-value t-display t-gold" />
            </div>
            <div className="stat-grid">
              <StatCard icon={Target} label="Correct answers" value={`${game.correct} / ${answered.length || 1}`} />
              <StatCard icon={Trophy} label="Reached" value={`Q${game.level}`} />
              <StatCard icon={Timer} label="Avg. answer time" value={avg ? `${(avg / 1000).toFixed(1)}s` : "—"} sub={fastest ? `fastest ${(fastest / 1000).toFixed(1)}s` : null} />
              <StatCard icon={Sparkles} label="Game length" value={formatDuration(game.endedAt - game.startedAt)} />
            </div>
            <div className="result__iq card">
              <div className="result__iq-top">
                <span className="result__iq-icon">
                  <Brain size={20} />
                </span>
                <div>
                  <div className="eyebrow">Quiz IQ</div>
                  <div className="result__iq-value t-num">
                    {game.iqAfter}
                    <span className={`result__delta ${delta >= 0 ? "is-up" : "is-down"}`}>
                      {delta >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                      {delta >= 0 ? "+" : ""}
                      {delta}
                    </span>
                  </div>
                </div>
                <span className="badge-tier" style={{ "--tier": tier.color }}>
                  {tier.name}
                </span>
              </div>
              <ProgressBar value={tier.progress} color={`linear-gradient(90deg, ${tier.color}, #fff)`} />
              <div className="result__iq-next">{tier.next ? `${tier.next.min - game.iqAfter} to ${tier.next.name}` : "Top tier reached — Mahagyani!"}</div>
            </div>
            <div className="result__lifelines card">
              <span className="eyebrow">Lifelines used</span>
              <div className="result__ll-row">
                {["fifty", "poll", "phone", "expert", "flip"].map((t) => (
                  <span key={t} className={`result__ll${usedLifelines.includes(t) ? " is-used" : ""}`} title={t}>
                    <LifelineGlyph type={t} size={22} />
                  </span>
                ))}
              </div>
            </div>
            {unlocked.length > 0 && (
              <div className="result__ach card">
                <span className="eyebrow">New achievements</span>
                <div className="result__ach-list">
                  {unlocked.map((id) => (
                    <motion.div key={id} className="ach-pill" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.2, type: "spring" }}>
                      <NamedIcon name={ACH[id]?.icon} size={15} /> {ACH[id]?.name}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="result__recap">
          <h2 className="section-title">Your game, question by question</h2>
          <QuestionRecap questions={game.questions} />
        </section>
      </div>

      <footer className="result__foot">
        <Button variant="glass" icon={Home} onClick={onMenu}>
          Menu
        </Button>
        <Button variant="glass" icon={HistoryIcon} onClick={onHistory}>
          History
        </Button>
        <Button variant="gold" size="lg" icon={RotateCcw} onClick={onPlayAgain}>
          Play again
        </Button>
      </footer>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="stat card">
      <Icon size={18} className="stat__icon" />
      <div className="stat__value t-num">{value}</div>
      <div className="stat__label">{label}</div>
      {sub && <div className="stat__sub">{sub}</div>}
    </div>
  );
}
