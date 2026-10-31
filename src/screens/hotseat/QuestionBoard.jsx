import { AnimatePresence, motion } from "framer-motion";
import Lozenge from "../../components/Lozenge";
import { LETTERS } from "../../lib/format";

const REVEALED = new Set(["correct", "wrong", "timeout", "walked"]);

export default function QuestionBoard({ q, qVisible, shown, selected, locked, removed, phase, flashAnswer, guess, onPick, flipping, interactive }) {
  const stateOf = (i) => {
    if (removed.includes(i)) return "removed";
    if (REVEALED.has(phase)) {
      if (i === q.answer && (phase === "correct" || flashAnswer)) return "correct";
      if (phase === "wrong" && i === locked) return "wrong";
      if (phase === "walked" && i === guess && i !== q.answer) return "wrong";
      if (phase === "correct" && i === locked) return "correct";
      return i === locked || i === guess ? "locked" : "dim";
    }
    if (i === locked || (phase === "guess" && i === guess)) return "locked";
    if (i === selected) return "selected";
    return "idle";
  };

  return (
    <div className={`board${flipping ? " board--flip" : ""}`}>
      <div className="board__qrow rail">
        <Lozenge size="q" state={phase === "locked" ? "gold" : "idle"} className="board__question">
          <AnimatePresence mode="wait">
            {q && qVisible && (
              <motion.span
                key={q.id}
                className="board__qtext"
                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                {q.q}
              </motion.span>
            )}
          </AnimatePresence>
        </Lozenge>
      </div>

      {[0, 2].map((row) => (
        <div key={row} className="board__row rail">
          {[row, row + 1].map((i) => {
            const state = stateOf(i);
            const visible = q && shown > i;
            const clickable = interactive && visible && state !== "removed";
            return (
              <Lozenge
                key={i}
                as="button"
                type="button"
                size="opt"
                state={state}
                interactive={clickable}
                disabled={!clickable}
                className={`board__opt${flashAnswer && i === q?.answer ? " lz--flash" : ""}`}
                onClick={() => clickable && onPick(i)}
                aria-label={visible ? `Option ${LETTERS[i]}: ${q.options[i]}` : `Option ${LETTERS[i]}`}
              >
                <span className="lz__label">{LETTERS[i]}:</span>
                <AnimatePresence mode="wait">
                  {visible && (
                    <motion.span
                      key={`${q.id}-${i}`}
                      className="board__otext"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {q.options[i]}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Lozenge>
            );
          })}
        </div>
      ))}
    </div>
  );
}
