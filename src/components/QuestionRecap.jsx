import { Check, X, Clock3, RefreshCcw, LogOut, Hourglass } from "lucide-react";
import { CategoryIcon } from "./icons";
import { LifelineGlyph } from "./icons";
import { CATEGORY_BY_ID } from "../data/categories";
import { amountFor } from "../data/prizes";
import { LETTERS, shortINR } from "../lib/format";

// Question-by-question breakdown of a finished game (used on Result and History).
export default function QuestionRecap({ questions }) {
  return (
    <ol className="recap">
      {questions.map((r, i) => {
        const cat = CATEGORY_BY_ID[r.c];
        const status = r.flipped ? "flipped" : r.timedOut ? "timeout" : r.walked ? "walked" : r.correct ? "right" : "wrong";
        return (
          <li key={`${r.id}-${i}`} className={`recap__item is-${status}`}>
            <div className="recap__level t-num">
              <span>Q{r.level}</span>
              <small>{shortINR(amountFor(r.level))}</small>
            </div>
            <div className="recap__body">
              <div className="recap__meta" style={{ "--cat": cat?.color }}>
                <CategoryIcon id={r.c} size={13} /> {cat?.name}
                {r.lifelines?.length > 0 && (
                  <span className="recap__ll">
                    {r.lifelines.map((l) => (
                      <span key={l} title={l}>
                        <LifelineGlyph type={l} size={16} />
                      </span>
                    ))}
                  </span>
                )}
              </div>
              <div className="recap__q">{r.q}</div>
              <div className="recap__answers">
                {status === "flipped" && (
                  <span className="recap__tag">
                    <RefreshCcw size={13} /> Flipped — replaced with a new question
                  </span>
                )}
                {r.chosen != null && (
                  <span className={`recap__ans ${r.correct ? "is-right" : "is-wrong"}`}>
                    {r.correct ? <Check size={14} /> : <X size={14} />} You: <b>{LETTERS[r.chosen]}</b> {r.options[r.chosen]}
                  </span>
                )}
                {status === "walked" && (
                  <span className="recap__tag">
                    <LogOut size={13} /> Walked away{r.guess != null ? ` · guessed ${LETTERS[r.guess]}` : ""}
                  </span>
                )}
                {status === "timeout" && (
                  <span className="recap__tag">
                    <Hourglass size={13} /> Time ran out
                  </span>
                )}
                {!r.correct && !r.flipped && (
                  <span className="recap__ans is-right">
                    <Check size={14} /> Answer: <b>{LETTERS[r.answer]}</b> {r.options[r.answer]}
                  </span>
                )}
              </div>
            </div>
            {!r.flipped && r.timeMs > 0 && (
              <div className="recap__time t-num" title="Time taken">
                <Clock3 size={12} /> {(r.timeMs / 1000).toFixed(1)}s
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
