import { motion } from "framer-motion";

// Donut of topic shares. `items`: [{ id, value, color }]
export function Donut({ items, size = 220, thickness = 26, children }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  let offset = 0;
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={thickness} />
        {items
          .filter((i) => i.value > 0)
          .map((i) => {
            const len = (i.value / total) * c;
            const seg = (
              <motion.circle
                key={i.id}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={i.color}
                strokeWidth={thickness}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                initial={false}
                animate={{ strokeDasharray: `${Math.max(0, len - 1.5)} ${c}`, strokeDashoffset: -offset }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            );
            offset += len;
            return seg;
          })}
      </svg>
      <div className="donut__center">{children}</div>
    </div>
  );
}

// Radar ("spider") chart. `axes`: [{ label, value 0..1, color }]
export function Radar({ axes, size = 300 }) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 58;
  const n = axes.length;
  const point = (i, v) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v];
  };
  const poly = axes.map((ax, i) => point(i, Math.max(0.04, ax.value)).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="radar" role="img" aria-label="Topic strengths" style={{ overflow: "visible" }}>
      {[0.25, 0.5, 0.75, 1].map((lv) => (
        <polygon key={lv} points={axes.map((_, i) => point(i, lv).join(",")).join(" ")} fill="none" stroke="rgba(255,255,255,.1)" />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,.08)" />;
      })}
      <motion.polygon
        points={poly}
        fill="rgba(246,210,122,.22)"
        stroke="#f6d27a"
        strokeWidth="2"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        transition={{ type: "spring", stiffness: 120, damping: 16 }}
      />
      {axes.map((ax, i) => {
        const [x, y] = point(i, Math.max(0.04, ax.value));
        const [lx, ly] = point(i, 1.2);
        return (
          <g key={ax.label}>
            <circle cx={x} cy={y} r="4" fill={ax.color} stroke="#fff" strokeWidth="1.2" />
            <text x={lx} y={ly} textAnchor={lx < cx - 8 ? "end" : lx > cx + 8 ? "start" : "middle"} dominantBaseline="middle" className="radar__label">
              {ax.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Tiny line chart for Quiz IQ over time.
export function Sparkline({ values, width = 320, height = 90 }) {
  if (values.length < 2) return <div className="spark spark--empty">Play a couple of games to see your trend</div>;
  const min = Math.min(...values) - 10;
  const max = Math.max(...values) + 10;
  const x = (i) => 6 + (i / (values.length - 1)) * (width - 12);
  const y = (v) => height - 8 - ((v - min) / (max - min || 1)) * (height - 16);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${d} L${x(values.length - 1)} ${height} L${x(0)} ${height} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="spark" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6d27a" stopOpacity=".35" />
          <stop offset="1" stopColor="#f6d27a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <motion.path d={d} fill="none" stroke="#f6d27a" strokeWidth="2.2" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r="4" fill="#fff" stroke="#f6d27a" strokeWidth="2" />
    </svg>
  );
}
