import { createContext, useContext, useEffect, useMemo, useState } from "react";

const StageCtx = createContext({ setMood: () => {}, flash: () => {} });

// The studio behind every screen: light beams, swaying spotlights, the lit floor and dust.
// Screens set the "mood" (menu, calm, suspense, correct, wrong, celebrate…) and the stage
// cross-fades its colours; `flash` fires a one-off full-screen pulse.
export function StageProvider({ children }) {
  const [mood, setMood] = useState("menu");
  const [flash, setFlash] = useState(null);
  const api = useMemo(() => ({ setMood, flash: (kind) => setFlash({ kind, key: Date.now() }) }), []);
  return (
    <StageCtx.Provider value={api}>
      <Stage mood={mood} flash={flash} />
      {children}
    </StageCtx.Provider>
  );
}

export const useStage = () => useContext(StageCtx);

export function useStageMood(mood) {
  const { setMood } = useStage();
  useEffect(() => {
    if (mood) setMood(mood);
  }, [mood, setMood]);
}

const SPOTS = [
  { x: "2%", r: "-28deg", d: "11s" },
  { x: "16%", r: "-14deg", d: "9s" },
  { x: "34%", r: "-4deg", d: "13s" },
  { x: "50%", r: "6deg", d: "10s" },
  { x: "66%", r: "14deg", d: "12s" },
  { x: "80%", r: "26deg", d: "9.5s" },
];

function Stage({ mood, flash }) {
  const dust = useMemo(
    () =>
      Array.from({ length: 46 }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        "--d": `${5 + Math.random() * 7}s`,
        "--delay": `${-Math.random() * 10}s`,
        scale: 0.6 + Math.random() * 1.2,
      })),
    []
  );

  return (
    <div className="stage" data-mood={mood} aria-hidden="true">
      <div className="stage__base" />
      <div className="stage__beams" />
      <div className="stage__beams stage__beams--b" />
      <div className="stage__rings">
        <svg viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="1 3" />
          <circle cx="100" cy="100" r="84" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="10 6" />
          <circle cx="100" cy="100" r="54" fill="none" stroke="currentColor" strokeWidth="0.4" />
          {Array.from({ length: 12 }, (_, i) => (
            <ellipse key={i} cx="100" cy="100" rx="52" ry="18" fill="none" stroke="currentColor" strokeWidth="0.3" transform={`rotate(${i * 15} 100 100)`} />
          ))}
        </svg>
      </div>
      <div className="stage__spots">
        {SPOTS.map((s, i) => (
          <i key={i} style={{ "--x": s.x, "--r": s.r, "--d": s.d }} />
        ))}
      </div>
      <div className="stage__floor" />
      <div className="stage__dust">
        {dust.map(({ scale, ...style }, i) => (
          <span key={i} style={{ ...style, width: 2 * scale, height: 2 * scale }} />
        ))}
      </div>
      <div className="stage__vignette" />
      {flash && <div key={flash.key} className="stage__flash" data-kind={flash.kind} />}
    </div>
  );
}
