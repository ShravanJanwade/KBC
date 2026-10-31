import { useEffect, useRef } from "react";

const PALETTE = ["#ffd56b", "#fff1bd", "#ff8a00", "#ff5fa2", "#45d4ff", "#7c4dff", "#2fdc72", "#ffffff"];
const GOLD = ["#fff6cf", "#f6d27a", "#e0a93a", "#ffcf5c"];

// Full-screen particle show: confetti, fireworks and/or a shower of gold coins.
// `modes` is any combination of "confetti" | "fireworks" | "coins".
export default function Celebration({ modes = ["confetti"], duration = 6000, intensity = 1 }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const parts = [];
    const rockets = [];
    const start = performance.now();
    let last = start;
    let nextRocket = start;
    let raf = 0;

    const confettiBurst = (x, y, n, spread = 1) => {
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9 * spread;
        const v = 6 + Math.random() * 9;
        parts.push({
          kind: "confetti",
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          w: 6 + Math.random() * 6,
          h: 10 + Math.random() * 8,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          flip: Math.random() * Math.PI,
          vf: 0.08 + Math.random() * 0.12,
          color: PALETTE[(Math.random() * PALETTE.length) | 0],
          life: 1,
          decay: 0.0025 + Math.random() * 0.003,
        });
      }
    };
    const explode = (x, y) => {
      const color = PALETTE[(Math.random() * 6) | 0];
      const n = 70 + ((Math.random() * 40) | 0);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.1;
        const v = 2 + Math.random() * 4.5;
        parts.push({ kind: "spark", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, color: Math.random() < 0.25 ? "#fff" : color, life: 1, decay: 0.011 + Math.random() * 0.01, px: x, py: y });
      }
    };
    const coin = () => {
      parts.push({ kind: "coin", x: Math.random() * w, y: -30, vx: (Math.random() - 0.5) * 1.2, vy: 2 + Math.random() * 3, r: 9 + Math.random() * 9, spin: Math.random() * Math.PI, vs: 0.08 + Math.random() * 0.1, life: 1, decay: 0, color: GOLD[(Math.random() * GOLD.length) | 0] });
    };

    if (modes.includes("confetti")) {
      confettiBurst(w * 0.15, h * 0.95, 90 * intensity);
      confettiBurst(w * 0.85, h * 0.95, 90 * intensity);
      confettiBurst(w * 0.5, h * 1.02, 70 * intensity, 0.6);
    }

    const tick = (t) => {
      const dt = Math.min(2.5, (t - last) / 16.67);
      last = t;
      const elapsed = t - start;
      const active = elapsed < duration;

      if (active && modes.includes("fireworks") && t >= nextRocket) {
        rockets.push({ x: w * (0.15 + Math.random() * 0.7), y: h + 10, vy: -(10 + Math.random() * 4), target: h * (0.15 + Math.random() * 0.3) });
        nextRocket = t + (380 + Math.random() * 520) / intensity;
      }
      if (active && modes.includes("coins") && Math.random() < 0.35 * intensity * dt) coin();
      if (active && modes.includes("confetti") && Math.random() < 0.18 * intensity * dt) {
        confettiBurst(Math.random() * w, -20, 3, 2);
      }

      ctx.clearRect(0, 0, w, h);

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy * dt;
        r.vy += 0.12 * dt;
        ctx.fillStyle = "rgba(255,240,200,0.9)";
        ctx.fillRect(r.x - 1.5, r.y, 3, 10);
        if (r.y <= r.target || r.vy >= -1) {
          explode(r.x, r.y);
          rockets.splice(i, 1);
        }
      }

      ctx.globalCompositeOperation = "lighter";
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        if (p.kind === "spark") {
          p.px = p.x;
          p.py = p.y;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.985;
          p.vy = p.vy * 0.985 + 0.05 * dt;
          p.life -= p.decay * dt;
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.px, p.py);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          if (p.life <= 0) parts.splice(i, 1);
        }
      }
      ctx.globalCompositeOperation = "source-over";

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        if (p.kind === "confetti") {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.985;
          p.vy = p.vy * 0.985 + 0.16 * dt;
          p.rot += p.vr * dt;
          p.flip += p.vf * dt;
          p.life -= p.decay * dt;
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5));
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(1, Math.cos(p.flip));
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
          if (p.life <= 0 || p.y > h + 40) parts.splice(i, 1);
        } else if (p.kind === "coin") {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 0.06 * dt;
          p.spin += p.vs * dt;
          const sx = Math.cos(p.spin);
          ctx.save();
          ctx.globalAlpha = 1;
          ctx.translate(p.x, p.y);
          ctx.scale(Math.max(0.12, Math.abs(sx)), 1);
          const g = ctx.createRadialGradient(-p.r * 0.3, -p.r * 0.3, 1, 0, 0, p.r);
          g.addColorStop(0, "#fffbe6");
          g.addColorStop(0.5, p.color);
          g.addColorStop(1, "#a0670f");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(120,70,0,0.8)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          if (Math.abs(sx) > 0.35) {
            ctx.fillStyle = "rgba(110,60,0,0.85)";
            ctx.font = `700 ${p.r * 1.2}px Poppins, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("₹", 0, 1);
          }
          ctx.restore();
          if (p.y > h + 40) parts.splice(i, 1);
        }
      }
      ctx.globalAlpha = 1;

      if (active || parts.length || rockets.length) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={ref} className="celebration" aria-hidden="true" />;
}
