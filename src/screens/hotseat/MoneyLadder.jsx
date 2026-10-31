import { useLayoutEffect, useRef, useState } from "react";
import { LADDER } from "../../data/prizes";
import { formatINR } from "../../lib/format";

const label = (amount) => (amount >= 1e7 ? `₹${amount / 1e7} Crore` : formatINR(amount));

// The money tree. `reached` = highest rung already won; `current` = rung being played.
// The orange cursor is one element that slides between rungs. It is measured and moved with a CSS
// transform rather than a shared-layout animation, which would block the screen's exit transition.
export default function MoneyLadder({ current, reached, compact = false }) {
  const list = useRef(null);
  const [cursor, setCursor] = useState(null);

  useLayoutEffect(() => {
    const measure = () => {
      const row = list.current?.querySelector(`[data-level="${current}"]`);
      setCursor(row ? { top: row.offsetTop, height: row.offsetHeight } : null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [current]);

  return (
    <ol ref={list} className={`ladder${compact ? " ladder--compact" : ""}`} aria-label="Prize ladder">
      <span className={`ladder__cursor${cursor ? " is-on" : ""}`} style={cursor ? { transform: `translateY(${cursor.top}px)`, height: cursor.height } : undefined} aria-hidden="true" />
      {[...LADDER].reverse().map((step) => {
        const isCurrent = step.level === current;
        const done = step.level <= reached;
        const cls = ["ladder__row", step.milestone && "is-milestone", step.jackpot && "is-jackpot", step.crore && "is-crore", done && "is-done", isCurrent && "is-current"]
          .filter(Boolean)
          .join(" ");
        return (
          <li key={step.level} data-level={step.level} className={cls} aria-current={isCurrent ? "step" : undefined}>
            <span className="ladder__num t-num">{step.level}</span>
            <span className="ladder__gem" aria-hidden="true">
              {done ? "◆" : ""}
            </span>
            <span className="ladder__amt t-num">{label(step.amount)}</span>
          </li>
        );
      })}
    </ol>
  );
}
