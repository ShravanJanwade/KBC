import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Trophy, Gamepad2, Coins, Target, Crown, Brain, Trash2, Play, Hourglass, LogOut, X, Gem, Medal } from "lucide-react";
import Avatar from "../components/Avatar";
import QuestionRecap from "../components/QuestionRecap";
import { BackButton, Button, Modal, Segmented } from "../components/ui";
import { CategoryBadge, LifelineGlyph } from "../components/icons";
import { Sparkline } from "../components/charts";
import { useStageMood } from "../components/Stage";
import { useApp } from "../state/AppContext";
import { CATEGORIES } from "../data/categories";
import { iqOf, tierOf } from "../engine/rating";
import { load } from "../lib/storage";
import { formatDateTime, formatDuration, formatINR, shortINR, timeAgo } from "../lib/format";
import "../styles/pages.css";

const OUTCOME = {
  won: { label: "Jackpot", icon: Gem, cls: "won" },
  walked: { label: "Walked away", icon: LogOut, cls: "walked" },
  wrong: { label: "Wrong answer", icon: X, cls: "wrong" },
  timeout: { label: "Time up", icon: Hourglass, cls: "timeout" },
};

export default function History({ onBack, onPlay }) {
  useStageMood("menu");
  const { history, profile, profiles, clearHistory } = useApp();
  const [tab, setTab] = useState("games");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const stats = useMemo(() => {
    const answered = history.flatMap((g) => g.questions.filter((q) => !q.flipped && (q.chosen != null || q.timedOut)));
    const right = answered.filter((q) => q.correct).length;
    return {
      games: history.length,
      total: history.reduce((s, g) => s + g.prize, 0),
      best: history.reduce((m, g) => Math.max(m, g.prize), 0),
      accuracy: answered.length ? Math.round((right / answered.length) * 100) : 0,
      avgLevel: history.length ? (history.reduce((s, g) => s + g.level, 0) / history.length).toFixed(1) : "0",
      crores: history.filter((g) => g.prize >= 1e7).length,
    };
  }, [history]);

  const iqTrend = useMemo(() => {
    const chron = [...history].reverse();
    return chron.length ? [chron[0].iqBefore, ...chron.map((g) => g.iqAfter)] : [];
  }, [history]);

  const filtered = history.filter((g) => filter === "all" || (filter === "cheque" ? g.prize > 0 : g.outcome === filter));

  const leaderboard = useMemo(
    () =>
      profiles
        .map((p) => {
          const h = p.id === profile?.id ? history : load(`history.${p.id}`, []);
          return { ...p, games: h.length, best: h.reduce((m, g) => Math.max(m, g.prize), 0), total: h.reduce((s, g) => s + g.prize, 0), iq: iqOf(p.rating.theta) };
        })
        .sort((a, b) => b.best - a.best || b.iq - a.iq),
    [profiles, profile, history]
  );

  const catStats = CATEGORIES.map((c) => ({ c, s: profile?.rating.cats?.[c.id] }))
    .filter((x) => x.s?.n)
    .sort((a, b) => b.s.right / b.s.n - a.s.right / a.s.n);

  return (
    <div className="page history">
      <header className="page__head">
        <BackButton onClick={onBack} />
        <div className="page__head-text">
          <h1 className="page__title t-gold">History</h1>
          <p className="page__sub">Every game, every answer, every rupee.</p>
        </div>
        <Segmented
          value={tab}
          onChange={setTab}
          label="History view"
          options={[
            { value: "games", label: "My games" },
            { value: "topics", label: "Topics" },
            { value: "board", label: "Leaderboard" },
          ]}
        />
      </header>

      <div className="page__body scroll">
        <div className="hist__stats">
          <Kpi icon={Gamepad2} label="Games played" value={stats.games} />
          <Kpi icon={Coins} label="Total winnings" value={shortINR(stats.total)} />
          <Kpi icon={Trophy} label="Best win" value={shortINR(stats.best)} />
          <Kpi icon={Target} label="Accuracy" value={`${stats.accuracy}%`} />
          <Kpi icon={Medal} label="Avg. question reached" value={stats.avgLevel} />
          <Kpi icon={Crown} label="Crorepati games" value={stats.crores} />
        </div>

        {tab === "games" && (
          <>
            <div className="hist__trend card">
              <div className="hist__trend-head">
                <span className="eyebrow">
                  <Brain size={13} /> Quiz IQ trend
                </span>
                <span className="t-num hist__trend-now">{iqOf(profile?.rating.theta ?? 0)}</span>
              </div>
              <Sparkline values={iqTrend} />
            </div>

            <div className="hist__filters">
              <Segmented
                value={filter}
                onChange={setFilter}
                label="Filter games"
                options={[
                  { value: "all", label: "All" },
                  { value: "cheque", label: "Won money" },
                  { value: "walked", label: "Walked away" },
                  { value: "wrong", label: "Wrong answer" },
                  { value: "timeout", label: "Time up" },
                ]}
              />
              {history.length > 0 && (
                <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setConfirmClear(true)}>
                  Clear history
                </Button>
              )}
            </div>

            {!filtered.length ? (
              <div className="empty">
                <Trophy size={40} className="t-faint" />
                <div>{history.length ? "No games match this filter." : "No games yet — your first cheque is waiting."}</div>
                {!history.length && (
                  <Button variant="gold" icon={Play} onClick={onPlay}>
                    Khelo!
                  </Button>
                )}
              </div>
            ) : (
              <ul className="games">
                {filtered.map((g) => {
                  const o = OUTCOME[g.outcome] ?? OUTCOME.walked;
                  const isOpen = open === g.id;
                  return (
                    <li key={g.id} className={`game card${isOpen ? " is-open" : ""}`}>
                      <button type="button" className="game__row" onClick={() => setOpen(isOpen ? null : g.id)} aria-expanded={isOpen}>
                        <span className={`game__badge is-${o.cls}`}>
                          <o.icon size={16} />
                        </span>
                        <span className="game__when">
                          <span className="game__outcome">{o.label}</span>
                          <span className="game__date" title={formatDateTime(g.endedAt)}>
                            {timeAgo(g.endedAt)} · {formatDuration(g.endedAt - g.startedAt)}
                          </span>
                        </span>
                        <span className="game__ladder" aria-label={`Reached question ${g.level}`}>
                          {Array.from({ length: 16 }, (_, i) => (
                            <i key={i} className={i < g.correct ? "is-won" : i === g.level - 1 ? `is-${o.cls}` : ""} />
                          ))}
                        </span>
                        <span className="game__ll">
                          {Object.keys(g.lifelines || {}).map((t) => (
                            <LifelineGlyph key={t} type={t} size={16} />
                          ))}
                        </span>
                        <span className="game__iq t-num" title="Quiz IQ change">
                          {g.iqAfter - g.iqBefore >= 0 ? "+" : ""}
                          {g.iqAfter - g.iqBefore} IQ
                        </span>
                        <span className={`game__prize t-num${g.prize ? "" : " is-zero"}`}>{formatINR(g.prize)}</span>
                        <ChevronDown size={18} className="game__chev" />
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div className="game__detail" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                            <QuestionRecap questions={g.questions} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {tab === "topics" && (
          <div className="card hist__topics">
            {!catStats.length ? (
              <div className="empty">Play a game to see how you do in each topic.</div>
            ) : (
              catStats.map(({ c, s }) => {
                const acc = s.right / s.n;
                return (
                  <div key={c.id} className="tbar" style={{ "--cat": c.color }}>
                    <CategoryBadge id={c.id} size={34} iconSize={17} />
                    <div className="tbar__body">
                      <div className="tbar__top">
                        <span>{c.name}</span>
                        <span className="t-num">
                          {s.right}/{s.n} · {Math.round(acc * 100)}%
                        </span>
                      </div>
                      <div className="tbar__track">
                        <motion.span initial={{ width: 0 }} animate={{ width: `${acc * 100}%` }} transition={{ duration: 0.8 }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === "board" && (
          <ol className="board-list">
            {leaderboard.map((p, i) => {
              const tier = tierOf(p.iq);
              return (
                <li key={p.id} className={`lb card${p.id === profile?.id ? " is-me" : ""}`}>
                  <span className={`lb__rank t-num rank-${i + 1}`}>{i + 1}</span>
                  <Avatar config={p.avatar} size={44} />
                  <span className="lb__who">
                    <span className="lb__name">{p.name}</span>
                    <span className="badge-tier" style={{ "--tier": tier.color }}>
                      {tier.name} · {p.iq}
                    </span>
                  </span>
                  <span className="lb__num">
                    <span className="t-num">{p.games}</span>
                    <small>games</small>
                  </span>
                  <span className="lb__num">
                    <span className="t-num">{shortINR(p.total)}</span>
                    <small>total</small>
                  </span>
                  <span className="lb__best t-num t-gold">{shortINR(p.best)}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} size="sm" label="Clear history">
        <div className="dialog glass glass--gold">
          <h2 className="dialog__title">Clear all games?</h2>
          <p className="dialog__text">This removes {profile?.name}'s game history. Your Quiz IQ, achievements and seen-question list stay as they are.</p>
          <div className="dialog__actions">
            <Button variant="glass" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => {
                clearHistory();
                setConfirmClear(false);
              }}
            >
              Clear history
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }) {
  return (
    <div className="kpi card">
      <Icon size={18} className="kpi__icon" />
      <div className="kpi__value t-num">{value}</div>
      <div className="kpi__label">{label}</div>
    </div>
  );
}
