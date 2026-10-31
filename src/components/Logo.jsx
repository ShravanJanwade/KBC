import { useId } from "react";

// Rupee glyph drawn as strokes so it renders crisply regardless of installed fonts.
const RUPEE = "M5 5 H33 M5 15 H33 M11 5 C30 5 30 27 11 27 M11 27 L31 49";

// The show's emblem, drawn in SVG: purple ring with arched "KAUN BANEGA", a navy core with a
// spinning gold spirograph and rupee pinwheel, and the silver CROREPATI banner with a moving shine.
export default function Logo({ size = 320, spin = true, shine = true, className = "", title = "Kaun Banega Crorepati" }) {
  const id = useId().replace(/:/g, "");
  const u = (n) => `${n}${id}`;
  const rupees = [0, 60, 120, 180, 240, 300];

  return (
    <svg viewBox="0 0 400 400" style={{ width: size, height: size }} className={`logo ${className}`} role="img" aria-label={title}>
      <defs>
        <linearGradient id={u("gold")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6cf" />
          <stop offset="0.35" stopColor="#f6d27a" />
          <stop offset="0.58" stopColor="#c58b25" />
          <stop offset="0.8" stopColor="#ffe8a0" />
          <stop offset="1" stopColor="#9c6a14" />
        </linearGradient>
        <radialGradient id={u("ring")} cx="50%" cy="38%" r="65%">
          <stop offset="0" stopColor="#6a37ad" />
          <stop offset="0.7" stopColor="#3a1a72" />
          <stop offset="1" stopColor="#24104c" />
        </radialGradient>
        <radialGradient id={u("core")} cx="50%" cy="42%" r="58%">
          <stop offset="0" stopColor="#2a2096" />
          <stop offset="0.65" stopColor="#141056" />
          <stop offset="1" stopColor="#090731" />
        </radialGradient>
        <linearGradient id={u("silver")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#eef1ff" />
          <stop offset="0.56" stopColor="#9aa6d1" />
          <stop offset="0.8" stopColor="#e9edff" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id={u("shine")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="0.58" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
          {shine && <animateTransform attributeName="gradientTransform" type="translate" values="-1.2 0; 1.2 0; 1.2 0" keyTimes="0; 0.55; 1" dur="4.2s" repeatCount="indefinite" />}
        </linearGradient>
        <path id={u("top")} d="M 50 200 A 150 150 0 0 1 350 200" />
        <path id={u("bot")} d="M 27 200 A 173 173 0 0 0 373 200" />
        <filter id={u("glow")} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="200" cy="200" r="196" fill={`url(#${u("ring")})`} stroke={`url(#${u("gold")})`} strokeWidth="5" />
      <circle cx="200" cy="200" r="187" fill="none" stroke="#f6d27a" strokeOpacity="0.35" strokeWidth="1.2" />
      <circle cx="200" cy="200" r="130" fill={`url(#${u("core")})`} />

      <g className={spin ? "logo__spiro" : undefined} style={{ transformOrigin: "200px 200px" }}>
        {Array.from({ length: 12 }, (_, i) => (
          <ellipse key={i} cx="200" cy="200" rx="122" ry="44" fill="none" stroke="#f2c14e" strokeOpacity="0.5" strokeWidth="1.3" transform={`rotate(${i * 15} 200 200)`} />
        ))}
        {Array.from({ length: 24 }, (_, i) => (
          <line key={i} x1="200" y1="200" x2="200" y2="74" stroke="#7fb3ff" strokeOpacity="0.18" strokeWidth="1" transform={`rotate(${i * 15} 200 200)`} />
        ))}
      </g>

      <g filter={`url(#${u("glow")})`}>
        {rupees.map((a) => (
          <g key={a} transform={`rotate(${a} 200 200) translate(181 84)`}>
            <path d={RUPEE} fill="none" stroke={`url(#${u("gold")})`} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
      </g>

      <circle cx="200" cy="200" r="130" fill="none" stroke="#8fc3ff" strokeWidth="5" />
      <circle cx="200" cy="200" r="136" fill="none" stroke="#f6d27a" strokeOpacity="0.5" strokeWidth="1" />

      <text className="logo__arc" fill={`url(#${u("silver")})`} fontSize="35" letterSpacing="5">
        <textPath href={`#${u("top")}`} startOffset="50%" textAnchor="middle">
          KAUN BANEGA
        </textPath>
      </text>
      <text className="logo__arc" fill={`url(#${u("silver")})`} fontSize="35" letterSpacing="5">
        <textPath href={`#${u("bot")}`} startOffset="50%" textAnchor="middle">
          KAUN BANEGA
        </textPath>
      </text>

      {[30, 370].map((x) => (
        <path key={x} d={`M${x} 188 L${x + 11} 200 L${x} 212 L${x - 11} 200 Z`} fill={`url(#${u("gold")})`} stroke="#5b3a08" strokeWidth="0.8" />
      ))}

      <rect x="34" y="169" width="332" height="62" rx="8" fill="#0b0838" fillOpacity="0.72" stroke={`url(#${u("gold")})`} strokeWidth="2" />
      <text x="200" y="219" textAnchor="middle" className="logo__crore" fontSize="52" fill={`url(#${u("silver")})`} stroke="#1b1252" strokeWidth="1.5" paintOrder="stroke">
        CROREPATI
      </text>
      {shine && (
        <text x="200" y="219" textAnchor="middle" className="logo__crore" fontSize="52" fill={`url(#${u("shine")})`}>
          CROREPATI
        </text>
      )}
    </svg>
  );
}
