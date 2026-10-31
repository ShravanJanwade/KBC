import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Play, SlidersHorizontal, History as HistoryIcon, UserRound, Settings as SettingsIcon, CircleHelp, Volume2, VolumeX, Trophy, Brain, Gamepad2, Library } from "lucide-react";
import Logo from "../components/Logo";
import Lozenge from "../components/Lozenge";
import Avatar from "../components/Avatar";
import { Button } from "../components/ui";
import { useStageMood } from "../components/Stage";
import { useApp } from "../state/AppContext";
import { iqOf, tierOf } from "../engine/rating";
import { QUESTIONS } from "../data/questions";
import { shortINR } from "../lib/format";
import { audio } from "../audio/engine";
import { sfx } from "../audio/synth";
import "../styles/screens.css";

export default function MainMenu({ go, onPlay }) {
  useStageMood("menu");
  const { profile, history, seen, settings, updateSettings } = useApp();

  useEffect(() => {
    audio.unlock();
    audio.music("theme");
  }, []);

  const iq = iqOf(profile?.rating.theta ?? 0);
  const tier = tierOf(iq);
  const best = history.reduce((m, g) => Math.max(m, g.prize), 0);
  const unseen = useMemo(() => QUESTIONS.filter((q) => !seen[q.id]).length, [seen]);

  const items = [
    { id: "play", label: "Khelo!", sub: "Fastest Finger First → Hot Seat", icon: Play, primary: true, onClick: onPlay },
    { id: "topics", label: "Topics", sub: "Tune what you get asked", icon: SlidersHorizontal, onClick: () => go("topics") },
    { id: "history", label: "History", sub: "Your games & records", icon: HistoryIcon, onClick: () => go("history") },
    { id: "profile", label: "Profile", sub: "Quiz IQ, badges & players", icon: UserRound, onClick: () => go("profile") },
    { id: "settings", label: "Settings", sub: "Sound, voices & gameplay", icon: SettingsIcon, onClick: () => go("settings") },
    { id: "howto", label: "How to Play", sub: "Rules, ladder & lifelines", icon: CircleHelp, onClick: () => go("howto") },
  ];

  if (!profile) return null;

  return (
    <div className="menu">
      <header className="menu__top">
        <motion.button
          type="button"
          className="player-chip glass"
          onClick={() => {
            sfx.click();
            go("profile");
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Avatar config={profile.avatar} size={44} ring />
          <span className="player-chip__text">
            <span className="player-chip__name">{profile.name}</span>
            <span className="badge-tier" style={{ "--tier": tier.color }}>
              {tier.name} · {iq}
            </span>
          </span>
        </motion.button>
        <Button
          variant="glass"
          size="md"
          icon={settings.muted ? VolumeX : Volume2}
          aria-label={settings.muted ? "Unmute" : "Mute"}
          onClick={() => updateSettings({ muted: !settings.muted })}
        />
      </header>

      <div className="menu__main">
        <motion.div className="menu__brand" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
          <Logo size="min(46vmin, 420px)" />
          <div className="menu__hindi t-hi t-gold">कौन बनेगा करोड़पति</div>
          <div className="menu__tag">16 questions · 2 milestones · ₹7 crore</div>
        </motion.div>

        <nav className="menu__nav" aria-label="Main menu">
          {items.map((it, i) => (
            <motion.div key={it.id} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.07, type: "spring", stiffness: 220, damping: 22 }} className="rail">
              <Lozenge
                as="button"
                type="button"
                size="menu"
                interactive
                state={it.primary ? "gold" : "idle"}
                className={`menu__item${it.primary ? " menu__item--primary" : ""}`}
                onMouseEnter={() => sfx.hover()}
                onClick={() => {
                  if (it.primary) sfx.select();
                  else sfx.click();
                  it.onClick();
                }}
              >
                <it.icon size={it.primary ? 24 : 20} className="menu__icon" />
                <span className="menu__label">
                  <span className="menu__name">{it.label}</span>
                  <span className="menu__sub">{it.sub}</span>
                </span>
              </Lozenge>
            </motion.div>
          ))}
        </nav>
      </div>

      <motion.footer className="menu__stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <Stat icon={Gamepad2} label="Games" value={history.length} />
        <Stat icon={Trophy} label="Best win" value={best ? shortINR(best) : "—"} />
        <Stat icon={Brain} label="Quiz IQ" value={iq} />
        <Stat icon={Library} label="Fresh questions" value={`${unseen} / ${QUESTIONS.length}`} />
      </motion.footer>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="menu__stat">
      <Icon size={18} className="menu__stat-icon" />
      <div>
        <div className="menu__stat-value t-num">{value}</div>
        <div className="menu__stat-label">{label}</div>
      </div>
    </div>
  );
}
