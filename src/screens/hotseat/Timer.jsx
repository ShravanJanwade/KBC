// The KBC clock: one lit segment per second that goes dark as time runs out.
export default function Timer({ total, left, paused, size = 128 }) {
  const secs = Math.max(0, Math.ceil(left));
  const frac = total ? Math.max(0, left / total) : 0;
  const color = frac > 0.5 ? "#45d4ff" : frac > 0.22 ? "#ffb020" : "#ff4d5e";
  const segments = Math.min(total, 90);
  const lit = Math.ceil((secs / total) * segments);
  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <div className={`timer${frac <= 0.22 && !paused ? " is-critical" : ""}${paused ? " is-paused" : ""}`} style={{ "--tc": color, width: size, height: size }} role="timer" aria-label={`${secs} seconds left`}>
      <svg viewBox="0 0 120 120" className="timer__svg">
        <defs>
          <radialGradient id="timer-face" cx="50%" cy="40%" r="60%">
            <stop offset="0" stopColor="#1d2a8c" />
            <stop offset="1" stopColor="#070b38" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="58" fill="url(#timer-face)" stroke="rgba(200,210,255,.55)" strokeWidth="1.5" />
        {Array.from({ length: segments }, (_, i) => {
          const a = (i / segments) * Math.PI * 2 - Math.PI / 2;
          const on = i < lit;
          return (
            <line
              key={i}
              x1={60 + Math.cos(a) * 44}
              y1={60 + Math.sin(a) * 44}
              x2={60 + Math.cos(a) * 54}
              y2={60 + Math.sin(a) * 54}
              stroke={on ? color : "rgba(255,255,255,.08)"}
              strokeWidth={segments > 60 ? 2 : 2.6}
              strokeLinecap="round"
              style={{ transition: "stroke .3s" }}
            />
          );
        })}
        <circle cx="60" cy="60" r={R - 14} fill="none" stroke={color} strokeOpacity=".25" strokeWidth="1" strokeDasharray={`${C}`} />
      </svg>
      <div className="timer__num t-num">{secs}</div>
      {paused && <div className="timer__paused">PAUSED</div>}
    </div>
  );
}
