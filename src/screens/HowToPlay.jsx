import { motion } from "framer-motion";
import { Play, Zap, Trophy, Flag, Timer, LogOut, Brain, Keyboard, SlidersHorizontal } from "lucide-react";
import { BackButton, Button } from "../components/ui";
import { LifelineGlyph } from "../components/icons";
import { useStageMood } from "../components/Stage";
import MoneyLadder from "./hotseat/MoneyLadder";
import { QUESTIONS, COUNT_BY_CATEGORY } from "../data/questions";
import "../styles/pages.css";
import "../styles/hotseat.css";

const LIFELINES = [
  { type: "fifty", name: "50:50", text: "The computer removes two wrong answers." },
  { type: "poll", name: "Audience Poll", text: "The studio audience votes on their keypads. Usually wise — but hard questions can fool the crowd." },
  { type: "phone", name: "Phone a Friend", text: "Call one of six friends, each strong in different topics. 30 seconds on the clock once they pick up." },
  { type: "expert", name: "Ask the Expert", text: "A quiz expert explains their reasoning over a live video call." },
  { type: "flip", name: "Flip the Question", text: "Unlocks after the ₹10,000 padaav. Swap the question for a fresh one at the same prize." },
];

const KEYS = [
  [["A", "B", "C", "D"], "Pick an answer (or 1–4)"],
  [["Enter"], "Lock it / next question"],
  [["Esc"], "Change your pick / pause"],
  [["⌫"], "Undo in Fastest Finger First"],
];

export default function HowToPlay({ onBack, onPlay }) {
  useStageMood("menu");
  return (
    <div className="page howto">
      <header className="page__head">
        <BackButton onClick={onBack} />
        <div>
          <h1 className="page__title t-gold">How to Play</h1>
          <p className="page__sub">Sixteen questions stand between you and ₹7 crore.</p>
        </div>
      </header>

      <div className="page__body scroll">
        <div className="howto__grid">
          <div className="howto__col">
            <Section icon={Zap} title="1 · Fastest Finger First">
              Race nine contestants to put four answers in the right order. The fastest correct answer takes the hot seat. Lose a round? You get another — up to three, then the host gives you a wildcard.
            </Section>
            <Section icon={Trophy} title="2 · The hot seat">
              Answer multiple-choice questions to climb the money tree. After you pick an answer the host asks <i>"Lock kiya jaye?"</i> — once locked, there's no going back.
            </Section>
            <Section icon={Flag} title="3 · Padaav (milestones)">
              ₹10,000 (Q5) and ₹3,20,000 (Q10) are guaranteed once you cross them. Get a later question wrong and you fall back to the last padaav. Careful: the ₹1 crore rung is <b>not</b> a padaav — miss the ₹7 crore question and you drop to ₹3,20,000.
            </Section>
            <Section icon={Timer} title="4 · The clock">
              45 seconds for Q1–5 and 60 seconds for Q6–10. From Q11 there's no clock. Using a lifeline pauses it. If time runs out, you leave with what you've already won.
            </Section>
            <Section icon={LogOut} title="5 · Walking away">
              Not sure? Quit and keep everything you've won so far. You can still tell the host which answer you would have picked — just for fun.
            </Section>
            <Section icon={Brain} title="6 · Smart, adaptive questions">
              {QUESTIONS.length.toLocaleString("en-IN")} questions across {Object.keys(COUNT_BY_CATEGORY).length} topics, and you won't see a repeat until you've seen them all. The game learns your <b>Quiz IQ</b> — overall and per topic — and picks questions that match the prize level and your ability, so it's never boringly easy or hopelessly hard.
            </Section>
            <Section icon={SlidersHorizontal} title="7 · Your topics">
              On the Topics screen, set any topic from Off to Max to control how often it comes up.
            </Section>
          </div>

          <div className="howto__col">
            <div className="card howto__card">
              <h3 className="section-title">Lifelines</h3>
              <div className="howto__lls">
                {LIFELINES.map((l, i) => (
                  <motion.div key={l.type} className="howto__ll" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
                    <span className="lifeline is-ready" aria-hidden="true">
                      <span className="lifeline__glyph">
                        <LifelineGlyph type={l.type} size={28} />
                      </span>
                    </span>
                    <span>
                      <b>{l.name}</b>
                      <small>{l.text}</small>
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="howto__ladder">
              <MoneyLadder current={5} reached={4} />
            </div>
            <div className="card howto__card">
              <h3 className="section-title">
                <Keyboard size={16} /> Keyboard
              </h3>
              <ul className="howto__keys">
                {KEYS.map(([keys, text]) => (
                  <li key={text}>
                    <span>
                      {keys.map((k) => (
                        <span key={k} className="kbd">
                          {k}
                        </span>
                      ))}
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="howto__cta">
          <Button variant="gold" size="lg" icon={Play} onClick={onPlay}>
            Khelo!
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <section className="howto__sec card">
      <h3 className="howto__h">
        <span className="howto__icon">
          <Icon size={18} />
        </span>
        {title}
      </h3>
      <p>{children}</p>
    </section>
  );
}
