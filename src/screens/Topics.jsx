import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Wand2 } from "lucide-react";
import { BackButton } from "../components/ui";
import { CategoryBadge } from "../components/icons";
import { Donut } from "../components/charts";
import { useStageMood } from "../components/Stage";
import { useApp } from "../state/AppContext";
import { CATEGORIES, RELEVANCE_LEVELS, DEFAULT_RELEVANCE, TOPIC_PRESETS } from "../data/categories";
import { COUNT_BY_CATEGORY, QUESTIONS } from "../data/questions";
import { sfx } from "../audio/synth";
import "../styles/pages.css";

export default function Topics({ onBack }) {
  useStageMood("menu");
  const { profile, updateProfile, seen } = useApp();
  const relevance = profile?.relevance ?? {};
  const levelOf = (id) => relevance[id] ?? DEFAULT_RELEVANCE;

  const fresh = useMemo(() => {
    const m = {};
    QUESTIONS.forEach((q) => {
      if (!seen[q.id]) m[q.c] = (m[q.c] || 0) + 1;
    });
    return m;
  }, [seen]);

  const available = CATEGORIES.filter((c) => COUNT_BY_CATEGORY[c.id]);
  const weightOf = (id) => (COUNT_BY_CATEGORY[id] ? RELEVANCE_LEVELS[levelOf(id)].weight : 0);
  const total = available.reduce((s, c) => s + weightOf(c.id), 0);
  const share = (id) => (total ? weightOf(id) / total : 0);
  const active = available.filter((c) => levelOf(c.id) > 0);
  const topMix = [...available].sort((a, b) => share(b.id) - share(a.id)).filter((c) => share(c.id) > 0);

  const setLevel = (id, v) => {
    sfx.click();
    updateProfile((p) => ({ relevance: { ...p.relevance, [id]: v } }));
  };
  const applyPreset = (preset) => {
    sfx.select();
    updateProfile({ relevance: Object.fromEntries(CATEGORIES.map((c) => [c.id, preset.values[c.id] ?? DEFAULT_RELEVANCE])) });
  };
  const matchesPreset = (preset) => CATEGORIES.every((c) => levelOf(c.id) === (preset.values[c.id] ?? DEFAULT_RELEVANCE));

  return (
    <div className="page topics">
      <header className="page__head">
        <BackButton onClick={onBack} />
        <div>
          <h1 className="page__title t-gold">Topics</h1>
          <p className="page__sub">Choose how often each topic shows up. Difficulty still adapts to you automatically.</p>
        </div>
      </header>

      <div className="page__body topics__layout">
        <div className="topics__main scroll">
          <div className="topics__presets">
            <span className="topics__presets-label">
              <Wand2 size={15} /> Presets
            </span>
            {TOPIC_PRESETS.map((p) => (
              <button key={p.id} type="button" className={`preset${matchesPreset(p) ? " is-active" : ""}`} onClick={() => applyPreset(p)} title={p.desc}>
                {p.name}
              </button>
            ))}
          </div>

          <div className="topics__grid">
            {CATEGORIES.map((c, i) => {
              const count = COUNT_BY_CATEGORY[c.id] || 0;
              const lvl = levelOf(c.id);
              const stats = profile?.rating.cats?.[c.id];
              const pct = Math.round(share(c.id) * 100);
              return (
                <motion.article
                  key={c.id}
                  className={`topic card${lvl === 0 ? " is-off" : ""}${!count ? " is-empty" : ""}`}
                  style={{ "--cat": c.color }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.025, 0.4) }}
                >
                  <div className="topic__head">
                    <CategoryBadge id={c.id} />
                    <div className="topic__names">
                      <div className="topic__name">{c.name}</div>
                      <div className="topic__hi t-hi">{c.hi}</div>
                    </div>
                    <div className="topic__pct t-num" title="Approximate share of questions">
                      {count ? `${pct}%` : "—"}
                    </div>
                  </div>
                  <p className="topic__blurb">{c.blurb}</p>
                  <div className="topic__share">
                    <span style={{ width: `${Math.min(100, pct * 3)}%` }} />
                  </div>
                  <div className="topic__levels" role="radiogroup" aria-label={`${c.name} relevance`}>
                    {RELEVANCE_LEVELS.map((r) => (
                      <button key={r.value} type="button" role="radio" aria-checked={lvl === r.value} className={`topic__lvl${lvl === r.value ? " is-on" : ""}`} onClick={() => setLevel(c.id, r.value)} disabled={!count}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div className="topic__foot">
                    {count ? (
                      <>
                        <span>
                          {count} questions · {fresh[c.id] || 0} fresh
                        </span>
                        {stats?.n ? <span>{Math.round((stats.right / stats.n) * 100)}% correct</span> : <span className="t-faint">not played yet</span>}
                      </>
                    ) : (
                      <span className="t-faint">Coming soon</span>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>

        <aside className="topics__side glass">
          <div className="eyebrow">Your topic mix</div>
          <Donut items={available.map((c) => ({ id: c.id, value: weightOf(c.id), color: c.color }))}>
            <div className="donut__big t-num">{active.length}</div>
            <div className="donut__small">topics active</div>
          </Donut>
          <ul className="mix">
            {topMix.slice(0, 8).map((c) => (
              <li key={c.id} className="mix__row">
                <span className="cat-dot" style={{ "--cat": c.color }} />
                <span className="mix__name">{c.name}</span>
                <span className="mix__pct t-num">{Math.round(share(c.id) * 100)}%</span>
              </li>
            ))}
            {topMix.length > 8 && <li className="mix__more">+ {topMix.length - 8} more</li>}
          </ul>
          {active.length < 3 && (
            <div className="topics__warn">
              <AlertTriangle size={16} /> Turn on at least 3 topics so there are enough questions at every difficulty. Until then the game borrows from other topics.
            </div>
          )}
          <p className="topics__note">Shares are approximate: the game also avoids repeating a topic back-to-back and matches each question's difficulty to the prize level and your Quiz IQ.</p>
        </aside>
      </div>
    </div>
  );
}
