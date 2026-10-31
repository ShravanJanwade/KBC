import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, UserPlus, Trash2, Check, Lock, ArrowRightLeft } from "lucide-react";
import Avatar from "../components/Avatar";
import AvatarBuilder from "../components/AvatarBuilder";
import { BackButton, Button, Modal, ProgressBar } from "../components/ui";
import { NamedIcon } from "../components/icons";
import { Radar } from "../components/charts";
import { useStageMood } from "../components/Stage";
import { useApp } from "../state/AppContext";
import { CATEGORIES } from "../data/categories";
import { ACHIEVEMENTS } from "../data/achievements";
import { iqOf, tierOf, TIERS } from "../engine/rating";
import { formatDate, shortINR } from "../lib/format";
import "../styles/pages.css";

export default function Profile({ onBack, onAddPlayer }) {
  useStageMood("menu");
  const { profile, profiles, updateProfile, switchProfile, deleteProfile, history } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  if (!profile) return null;
  const iq = iqOf(profile.rating.theta);
  const tier = tierOf(iq);
  const best = history.reduce((m, g) => Math.max(m, g.prize), 0);

  const played = CATEGORIES.map((c) => ({ c, s: profile.rating.cats?.[c.id] })).filter((x) => x.s?.n);
  const axes = [...played]
    .sort((a, b) => b.s.n - a.s.n)
    .slice(0, 8)
    .map(({ c, s }) => ({ label: c.name.split(/ & |, /)[0], value: s.right / s.n, color: c.color }));
  const ranked = played.filter((x) => x.s.n >= 3).sort((a, b) => b.s.right / b.s.n - a.s.right / a.s.n);
  const strongest = ranked[0];
  const weakest = ranked.length > 1 ? ranked[ranked.length - 1] : null;
  const unlockedCount = ACHIEVEMENTS.filter((a) => profile.achievements?.[a.id]).length;

  const startEdit = () => {
    setDraft({ name: profile.name, city: profile.city, avatar: profile.avatar });
    setEditing(true);
  };
  const saveEdit = () => {
    if (draft.name.trim().length < 2) return;
    updateProfile({ name: draft.name.trim(), city: draft.city.trim(), avatar: draft.avatar });
    setEditing(false);
  };

  return (
    <div className="page profile">
      <header className="page__head">
        <BackButton onClick={onBack} />
        <div>
          <h1 className="page__title t-gold">Profile</h1>
          <p className="page__sub">Your Quiz IQ, strengths and achievements.</p>
        </div>
      </header>

      <div className="page__body scroll">
        <div className="prof__grid">
          <section className="prof__card glass glass--gold">
            <Avatar config={profile.avatar} size={132} ring />
            <h2 className="prof__name">{profile.name}</h2>
            {profile.city && <div className="prof__city">{profile.city}</div>}
            <span className="badge-tier" style={{ "--tier": tier.color }}>
              {tier.name} · {tier.en}
            </span>
            <div className="prof__iq">
              <span className="eyebrow">Quiz IQ</span>
              <span className="prof__iq-value t-num">{iq}</span>
            </div>
            <div className="prof__tierbar">
              <ProgressBar value={tier.progress} color={`linear-gradient(90deg, ${tier.color}, #fff)`} />
              <div className="prof__tiernext">{tier.next ? `${tier.next.min - iq} IQ to ${tier.next.name}` : "Highest tier reached"}</div>
            </div>
            <div className="prof__tiers" aria-label="Tiers">
              {TIERS.map((t, i) => (
                <span key={t.name} className={i <= tier.index ? "is-on" : ""} style={{ "--tier": t.color }} title={`${t.name} (${t.en})`} />
              ))}
            </div>
            <div className="prof__facts">
              <div>
                <b className="t-num">{history.length}</b>
                <span>games</span>
              </div>
              <div>
                <b className="t-num">{best ? shortINR(best) : "—"}</b>
                <span>best win</span>
              </div>
              <div>
                <b className="t-num">{profile.rating.n}</b>
                <span>answers</span>
              </div>
            </div>
            <div className="prof__since">Playing since {formatDate(profile.createdAt)}</div>
            <Button variant="glass" size="sm" icon={Pencil} onClick={startEdit}>
              Edit profile
            </Button>
          </section>

          <section className="prof__strengths card">
            <h3 className="section-title">Strengths</h3>
            {axes.length >= 3 ? (
              <>
                <Radar axes={axes} />
                <div className="prof__insights">
                  {strongest && (
                    <div className="insight insight--up">
                      <span>Strongest</span>
                      <b>{strongest.c.name}</b>
                      <small>{Math.round((strongest.s.right / strongest.s.n) * 100)}% correct</small>
                    </div>
                  )}
                  {weakest && (
                    <div className="insight insight--down">
                      <span>Needs practice</span>
                      <b>{weakest.c.name}</b>
                      <small>{Math.round((weakest.s.right / weakest.s.n) * 100)}% correct</small>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="empty">Answer questions from at least three topics to unlock your strengths radar.</div>
            )}
          </section>
        </div>

        <section className="prof__section">
          <h3 className="section-title">
            Achievements <span className="t-dim t-num">{unlockedCount} / {ACHIEVEMENTS.length}</span>
          </h3>
          <div className="ach-grid">
            {ACHIEVEMENTS.map((a, i) => {
              const at = profile.achievements?.[a.id];
              return (
                <motion.div key={a.id} className={`ach card${at ? " is-on" : ""}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <span className="ach__icon">{at ? <NamedIcon name={a.icon} size={20} /> : <Lock size={16} />}</span>
                  <span className="ach__text">
                    <b>{a.name}</b>
                    <small>{a.desc}</small>
                    {at && <em>{formatDate(at)}</em>}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="prof__section">
          <h3 className="section-title">Players on this device</h3>
          <div className="players">
            {profiles.map((p) => {
              const pIq = iqOf(p.rating.theta);
              const isMe = p.id === profile.id;
              return (
                <div key={p.id} className={`player card${isMe ? " is-me" : ""}`}>
                  <Avatar config={p.avatar} size={48} />
                  <span className="player__who">
                    <b>{p.name}</b>
                    <small>
                      Quiz IQ {pIq}
                      {p.city ? ` · ${p.city}` : ""}
                    </small>
                  </span>
                  {isMe ? (
                    <span className="chip chip--gold">
                      <Check size={13} /> Playing
                    </span>
                  ) : (
                    <Button variant="glass" size="sm" icon={ArrowRightLeft} onClick={() => switchProfile(p.id)}>
                      Switch
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" icon={Trash2} aria-label={`Delete ${p.name}`} onClick={() => setToDelete(p)} />
                </div>
              );
            })}
            <button type="button" className="player player--add card" onClick={onAddPlayer}>
              <UserPlus size={22} /> Add a new player
            </button>
          </div>
        </section>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} size="lg" label="Edit profile">
        {draft && (
          <div className="glass glass--gold prof__edit">
            <h2 className="dialog__title">Edit profile</h2>
            <div className="prof__edit-fields">
              <label className="field">
                <span className="field__label">Name</span>
                <input className="input" maxLength={22} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </label>
              <label className="field">
                <span className="field__label">City</span>
                <input className="input" maxLength={26} value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
              </label>
            </div>
            <AvatarBuilder value={draft.avatar} onChange={(avatar) => setDraft({ ...draft, avatar })} />
            <div className="dialog__actions prof__edit-actions">
              <Button variant="glass" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button variant="gold" icon={Check} onClick={saveEdit} disabled={draft.name.trim().length < 2}>
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} size="sm" label="Delete player">
        {toDelete && (
          <div className="dialog glass glass--gold">
            <h2 className="dialog__title">Delete {toDelete.name}?</h2>
            <p className="dialog__text">Their Quiz IQ, achievements and game history will be permanently removed from this device.</p>
            <div className="dialog__actions">
              <Button variant="glass" onClick={() => setToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={Trash2}
                onClick={() => {
                  deleteProfile(toDelete.id);
                  setToDelete(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
