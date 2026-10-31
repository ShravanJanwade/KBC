import { useId } from "react";
import { BACKGROUNDS, HAIR_COLORS, OUTFIT_COLORS, SKIN } from "./avatarParts";

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amt));
  const b = Math.min(255, Math.max(0, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const HAIR_BACK = {
  long: "M35 58 C33 31 47 23 60 23 C74 23 88 31 85 58 L88 100 C80 104 71 101 66 96 L54 96 C49 101 40 104 32 100 Z",
  bob: "M35 60 C33 32 47 24 60 24 C74 24 87 32 85 60 L86 80 C81 85 74 84 70 81 L50 81 C46 84 39 85 34 80 Z",
  ponytail: "M76 38 C92 44 96 66 90 90 C86 96 80 94 81 88 C86 70 84 54 74 46 Z",
};

const HAIR_FRONT = {
  short: "M38 60 C35 39 46 26 60 26 C75 26 86 37 82 60 C80 50 77 44 71 41 C62 46 50 46 44 43 C41 47 39 53 38 60 Z",
  side: "M38 62 C34 38 48 25 62 26 C78 27 87 40 82 62 C81 52 79 46 74 42 C66 39 55 42 45 49 C42 52 40 56 38 62 Z",
  spiky: "M38 58 L39 40 L45 33 L46 24 L53 30 L57 20 L63 28 L69 21 L71 30 L78 29 L80 41 L82 58 C79 49 75 44 70 42 C62 46 50 46 44 43 C41 48 39 53 38 58 Z",
  long: "M39 56 C38 36 50 27 60 27 C71 27 82 35 81 56 C78 45 71 38 60 38 C50 38 43 45 39 56 Z",
  bob: "M38 58 C37 36 49 27 60 27 C72 27 83 36 82 58 C79 47 74 42 66 40 C60 44 50 44 44 42 C41 46 39 51 38 58 Z",
  bun: "M39 53 C39 35 50 28 60 28 C70 28 81 35 81 53 C76 43 69 38 60 38 C51 38 44 43 39 53 Z",
  ponytail: "M39 53 C39 35 50 28 60 28 C70 28 81 35 81 53 C76 43 69 38 60 38 C51 38 44 43 39 53 Z",
  bald: "M37 62 C36 56 37 51 39 48 L41 60 Z M83 62 C84 56 83 51 81 48 L79 60 Z",
};

export default function Avatar({ config, size = 64, className = "", ring = false, title }) {
  const id = useId().replace(/:/g, "");
  const a = config ?? {};
  const skin = SKIN[a.skin ?? 1];
  const skinDark = shade(skin, -28);
  const hairColor = HAIR_COLORS[a.hairColor ?? 0];
  const outfit = OUTFIT_COLORS[a.outfitColor ?? 3];
  const outfitDark = shade(outfit, -40);
  const [bg1, bg2] = BACKGROUNDS[a.bg ?? 0];
  const hair = a.hair ?? "short";

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`avatar ${ring ? "avatar--ring" : ""} ${className}`}
      role="img"
      aria-label={title || "Avatar"}
    >
      <defs>
        <radialGradient id={`bg${id}`} cx="50%" cy="35%" r="75%">
          <stop offset="0" stopColor={bg1} />
          <stop offset="1" stopColor={bg2} />
        </radialGradient>
        <clipPath id={`c${id}`}>
          <circle cx="60" cy="60" r="60" />
        </clipPath>
        <linearGradient id={`o${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={outfit} />
          <stop offset="1" stopColor={outfitDark} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#c${id})`}>
        <rect width="120" height="120" fill={`url(#bg${id})`} />
        <circle cx="60" cy="38" r="46" fill="#fff" opacity="0.08" />

        {hair === "bun" && <circle cx="60" cy="24" r="11" fill={hairColor} />}
        {HAIR_BACK[hair] && <path d={HAIR_BACK[hair]} fill={hairColor} />}

        {/* neck & body */}
        <path d="M51 72 L51 92 Q60 98 69 92 L69 72 Z" fill={skinDark} />
        <path d="M12 122 C14 103 27 93 44 89 L52 87 Q60 94 68 87 L76 89 C93 93 106 103 108 122 Z" fill={`url(#o${id})`} />
        <Outfit kind={a.outfit ?? "tee"} color={outfit} dark={outfitDark} skin={skin} />

        {/* head */}
        <ellipse cx="39.5" cy="59" rx="4.2" ry="6.5" fill={skinDark} />
        <ellipse cx="80.5" cy="59" rx="4.2" ry="6.5" fill={skinDark} />
        <ellipse cx="60" cy="56" rx="21" ry="25" fill={skin} />
        <ellipse cx="51" cy="66" rx="4" ry="2.4" fill="#ff7a7a" opacity="0.18" />
        <ellipse cx="69" cy="66" rx="4" ry="2.4" fill="#ff7a7a" opacity="0.18" />

        {a.earrings && (
          <>
            <circle cx="39" cy="67.5" r="2.4" fill="#f6c453" />
            <circle cx="81" cy="67.5" r="2.4" fill="#f6c453" />
          </>
        )}

        {/* face */}
        <path d="M47.5 50.5 Q51.5 48.3 55.5 50.3" stroke={hair === "bald" ? skinDark : hairColor} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M64.5 50.3 Q68.5 48.3 72.5 50.5" stroke={hair === "bald" ? skinDark : hairColor} strokeWidth="2" fill="none" strokeLinecap="round" />
        <ellipse cx="52" cy="57.5" rx="2.5" ry="2.9" fill="#1b1410" />
        <ellipse cx="68" cy="57.5" rx="2.5" ry="2.9" fill="#1b1410" />
        <circle cx="52.9" cy="56.5" r="0.8" fill="#fff" />
        <circle cx="68.9" cy="56.5" r="0.8" fill="#fff" />
        <path d="M60 59 Q58.2 64.5 59.6 66 Q61.2 66.6 62.6 65.6" stroke={skinDark} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <path d="M53.5 71 Q60 76.5 66.5 71" stroke="#7a2e2e" strokeWidth="2" fill="none" strokeLinecap="round" />

        {a.beard === "stubble" && <path d="M41 61 C41 78 50 87 60 87 C70 87 79 78 79 61 C76 70 72 76 66 77 L54 77 C48 76 44 70 41 61 Z" fill={hairColor} opacity="0.28" />}
        {a.beard === "full" && <path d="M40 60 C40 79 49 89 60 89 C71 89 80 79 80 60 C77 69 73 74 67 74.5 C63 73 57 73 53 74.5 C47 74 43 69 40 60 Z" fill={hairColor} />}
        {(a.beard === "mustache" || a.beard === "full") && (
          <path d="M51 70.5 C55 67 58 68 60 69.3 C62 68 65 67 69 70.5 C66 72.4 63 71.6 60 71.4 C57 71.6 54 72.4 51 70.5 Z" fill={hairColor} />
        )}

        {a.bindi && <circle cx="60" cy="46" r="1.9" fill="#e11d48" />}

        {hair === "turban" ? (
          <g>
            <path d="M36 51 C33 28 47 16 60 16 C74 16 88 28 84 51 C80 45 71 42 60 42 C49 42 40 45 36 51 Z" fill={outfit === "#f1f5f9" ? "#f59e0b" : shade(outfit, 10)} />
            <path d="M40 44 C48 30 66 24 80 38" stroke={shade(outfit, -30)} strokeWidth="2" fill="none" opacity="0.6" />
            <path d="M42 36 C52 26 68 22 78 30" stroke={shade(outfit, -30)} strokeWidth="2" fill="none" opacity="0.5" />
            <path d="M56 42 L60 34 L64 42 Z" fill={shade(outfit, -20)} />
          </g>
        ) : (
          HAIR_FRONT[hair] && <path d={HAIR_FRONT[hair]} fill={hairColor} />
        )}
        {hair === "curly" &&
          [
            [41, 46, 7], [45, 37, 8], [53, 31, 8.5], [62, 29, 9], [71, 32, 8.5], [78, 39, 8], [80, 48, 6.5], [40, 54, 5], [81, 55, 5],
          ].map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} fill={hairColor} />)}

        {a.glasses && (
          <g stroke="#1a1a24" strokeWidth="1.8" fill="rgba(180,220,255,0.12)">
            <rect x="44.5" y="52.5" width="14" height="10.5" rx="4" />
            <rect x="61.5" y="52.5" width="14" height="10.5" rx="4" />
            <path d="M58.5 56.5 Q60 55 61.5 56.5" fill="none" />
          </g>
        )}
      </g>
    </svg>
  );
}

function Outfit({ kind, color, dark, skin }) {
  switch (kind) {
    case "kurta":
      return (
        <g>
          <path d="M52 87 Q60 94 68 87 L66 86 L54 86 Z" fill={dark} />
          <path d="M60 92 L60 112" stroke={dark} strokeWidth="1.6" />
          {[97, 103, 109].map((y) => (
            <circle key={y} cx="60" cy={y} r="1.3" fill="#f6d27a" />
          ))}
        </g>
      );
    case "blazer":
      return (
        <g>
          <path d="M52 87 L60 108 L68 87 Q60 92 52 87 Z" fill="#f1f5f9" />
          <path d="M57.5 92 L60 104 L62.5 92 L60 90 Z" fill="#b91c1c" />
          <path d="M44 89 L52 87 L58 106 L50 122 L38 122 Z" fill={dark} opacity="0.9" />
          <path d="M76 89 L68 87 L62 106 L70 122 L82 122 Z" fill={dark} opacity="0.9" />
        </g>
      );
    case "saree":
      return (
        <g>
          <path d="M44 89 L52 87 Q60 94 68 87 L76 89 L102 122 L82 122 Z" fill={shade(color, 35)} opacity="0.95" />
          <path d="M70 88 L98 122" stroke="#f6c453" strokeWidth="2.4" />
          <path d="M52 87 Q60 94 68 87" stroke={skin} strokeWidth="1" fill="none" />
        </g>
      );
    case "hoodie":
      return (
        <g>
          <path d="M42 90 C46 80 54 82 60 92 C66 82 74 80 78 90" stroke={dark} strokeWidth="4" fill="none" />
          <path d="M55 96 L55 106 M65 96 L65 106" stroke="#f1f5f9" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      );
    default:
      return <path d="M51 87.5 Q60 95 69 87.5" stroke={dark} strokeWidth="2.4" fill="none" />;
  }
}
