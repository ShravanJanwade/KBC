import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import Logo from "../components/Logo";
import AvatarBuilder from "../components/AvatarBuilder";
import { randomAvatar } from "../components/avatarParts";
import { Button } from "../components/ui";
import { CategoryIcon } from "../components/icons";
import { useStageMood } from "../components/Stage";
import { useApp } from "../state/AppContext";
import { SKILL_LEVELS } from "../engine/rating";
import { CATEGORIES } from "../data/categories";
import { sfx } from "../audio/synth";
import { audio } from "../audio/engine";
import "../styles/screens.css";

const CITIES = ["Mumbai", "Delhi", "Bengaluru", "Kolkata", "Chennai", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Patna", "Bhopal", "Indore", "Chandigarh", "Kochi", "Guwahati", "Bhubaneswar", "Nagpur", "Varanasi", "Dehradun", "Surat", "Ranchi", "Srinagar", "Shillong", "Goa"];
const STEPS = ["Who's playing?", "Create your look", "Your quiz level", "Favourite topics"];
const MAX_FAVS = 5;

export default function Onboarding({ onDone, onCancel }) {
  useStageMood("menu");
  const { createProfile } = useApp();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [avatar, setAvatar] = useState(randomAvatar);
  const [level, setLevel] = useState("enthusiast");
  const [favs, setFavs] = useState([]);

  const canNext = step !== 0 || name.trim().length >= 2;

  const next = () => {
    if (!canNext) return sfx.error();
    if (step === STEPS.length - 1) {
      audio.unlock();
      sfx.fanfare();
      createProfile({ name, city, avatar, level, favourites: favs });
      onDone();
      return;
    }
    sfx.whoosh("up", 0.35);
    setDir(1);
    setStep((s) => s + 1);
  };
  const back = () => {
    sfx.back();
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  const toggleFav = (id) => {
    sfx.click();
    setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : f.length >= MAX_FAVS ? f : [...f, id]));
  };

  return (
    <div className="onb">
      <motion.div className="onb__card glass glass--gold" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 24 }}>
        <header className="onb__head">
          <Logo size={54} spin={false} shine={false} />
          <div className="onb__head-text">
            <div className="eyebrow">Step {step + 1} of {STEPS.length}</div>
            <h1 className="onb__title">{STEPS[step]}</h1>
          </div>
          <div className="onb__dots" aria-hidden="true">
            {STEPS.map((_, i) => (
              <span key={i} className={i <= step ? "is-on" : ""} />
            ))}
          </div>
          {onCancel && <Button variant="ghost" size="sm" icon={X} aria-label="Cancel" onClick={onCancel} />}
        </header>

        <div className="onb__body">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: 40 * dir }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 * dir }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="onb__step"
            >
              {step === 0 && (
                <form
                  className="onb__form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    next();
                  }}
                >
                  <p className="onb__lead">
                    Namaskar! Hot seat par baithne se pehle, apna parichay dijiye. <span className="t-dim">Introduce yourself before you take the hot seat.</span>
                  </p>
                  <label className="field">
                    <span className="field__label">Your name</span>
                    <input className="input" autoFocus maxLength={22} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Shravan" />
                  </label>
                  <label className="field">
                    <span className="field__label">Your city (the host will announce it)</span>
                    <input className="input" list="onb-cities" maxLength={26} value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Pune" />
                    <datalist id="onb-cities">
                      {CITIES.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </label>
                  <button type="submit" hidden />
                </form>
              )}

              {step === 1 && <AvatarBuilder value={avatar} onChange={setAvatar} />}

              {step === 2 && (
                <div className="onb__levels">
                  <p className="onb__lead">
                    This sets your starting <b className="t-gold">Quiz IQ</b>. The game keeps learning from every answer, so don't worry about picking wrong.
                  </p>
                  <div className="onb__level-grid">
                    {SKILL_LEVELS.map((l, i) => (
                      <button
                        key={l.id}
                        type="button"
                        className={`onb__level card${level === l.id ? " is-active" : ""}`}
                        onClick={() => {
                          sfx.select();
                          setLevel(l.id);
                        }}
                      >
                        <div className="onb__level-stars">{"★".repeat(i + 1)}</div>
                        <div className="onb__level-name">{l.name}</div>
                        <div className="onb__level-hi t-hi">{l.hi}</div>
                        <div className="onb__level-desc">{l.desc}</div>
                        {level === l.id && <Check className="onb__level-check" size={18} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <p className="onb__lead">
                    Pick up to {MAX_FAVS} topics you love — they'll come up more often. You can fine-tune every topic later from <b>Topics</b>.
                  </p>
                  <div className="onb__topics">
                    {CATEGORIES.map((c) => {
                      const on = favs.includes(c.id);
                      return (
                        <button key={c.id} type="button" className={`onb__topic${on ? " is-on" : ""}`} style={{ "--cat": c.color }} onClick={() => toggleFav(c.id)} aria-pressed={on}>
                          <CategoryIcon id={c.id} size={18} />
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="onb__foot">
          {step > 0 ? (
            <Button variant="glass" icon={ArrowLeft} onClick={back}>
              Back
            </Button>
          ) : (
            <span />
          )}
          <Button variant="gold" size="lg" iconRight={step === STEPS.length - 1 ? Check : ArrowRight} onClick={next} disabled={!canNext}>
            {step === STEPS.length - 1 ? "Shuru karein!" : "Next"}
          </Button>
        </footer>
      </motion.div>
    </div>
  );
}
