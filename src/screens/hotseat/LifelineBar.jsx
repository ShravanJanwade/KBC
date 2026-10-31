import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { LifelineGlyph } from "../../components/icons";
import { sfx } from "../../audio/synth";

const LIFELINE_ORDER = ["fifty", "poll", "phone", "expert", "flip"];
const LIFELINE_NAMES = {
  fifty: "50:50",
  poll: "Audience Poll",
  phone: "Phone a Friend",
  expert: "Ask the Expert",
  flip: "Flip the Question",
};

export default function LifelineBar({ state, onUse, enabled }) {
  return (
    <div className="lifelines" role="toolbar" aria-label="Lifelines">
      {LIFELINE_ORDER.map((t, i) => {
        const s = state[t];
        const title = `${LIFELINE_NAMES[t]}${s === "used" ? " (used)" : s === "locked" ? " — unlocks after ₹10,000" : ""}`;
        return (
          <motion.button
            key={t}
            type="button"
            className={`lifeline is-${s}`}
            disabled={!enabled || s !== "ready"}
            onMouseEnter={() => enabled && s === "ready" && sfx.hover()}
            onClick={() => onUse(t)}
            title={title}
            aria-label={title}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 300, damping: 18 }}
          >
            <span className="lifeline__glyph">
              <LifelineGlyph type={t} size={30} />
            </span>
            {s === "used" && <span className="lifeline__x" aria-hidden="true" />}
            {s === "locked" && (
              <span className="lifeline__lock" aria-hidden="true">
                <Lock size={11} strokeWidth={2.6} />
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
