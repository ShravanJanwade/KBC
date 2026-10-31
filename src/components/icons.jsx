import {
  BookOpen, Brain, CalendarDays, Clapperboard, Coffee, Coins, Cpu, Crown, Flag, FlaskConical, Flame, Footprints, Gem, Globe,
  GraduationCap, Hand, HeartPulse, Hourglass, Landmark, Leaf, Map, Music, PhoneCall, RefreshCcw, Rocket, Scale, ShieldCheck,
  Sigma, Sparkles, Star, Timer, TrendingUp, Trophy, Users, Zap,
} from "lucide-react";
import { CATEGORY_BY_ID } from "../data/categories";

function Cricket({ size = 24, strokeWidth = 2, color = "currentColor", ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d="M3 3l4.2 4.2" />
      <path d="M6.2 8.6 8.6 6.2l9.9 9.9a1.7 1.7 0 0 1-2.4 2.4z" />
      <circle cx="18" cy="6" r="2.4" />
    </svg>
  );
}

const CATEGORY_ICONS = {
  landmark: Landmark,
  globe: Globe,
  map: Map,
  flask: FlaskConical,
  rocket: Rocket,
  cricket: Cricket,
  trophy: Trophy,
  clapper: Clapperboard,
  music: Music,
  flame: Flame,
  book: BookOpen,
  scale: Scale,
  trending: TrendingUp,
  cpu: Cpu,
  sparkles: Sparkles,
  leaf: Leaf,
  heart: HeartPulse,
  sigma: Sigma,
  coffee: Coffee,
  star: Star,
};

const NAMED = { Footprints, Flag, Coins, Crown, Gem, ShieldCheck, Zap, Hourglass, Hand, PhoneCall, Timer, Sparkles, CalendarDays, Brain, GraduationCap, Star, Trophy };

export function CategoryIcon({ id, icon, size = 20, ...rest }) {
  const C = CATEGORY_ICONS[icon ?? CATEGORY_BY_ID[id]?.icon] ?? Star;
  return <C size={size} strokeWidth={1.9} {...rest} />;
}

export function CategoryBadge({ id, size = 40, iconSize = 20 }) {
  const cat = CATEGORY_BY_ID[id];
  return (
    <span className="cat-icon" style={{ "--cat": cat?.color ?? "#888", width: size, height: size }}>
      <CategoryIcon id={id} size={iconSize} />
    </span>
  );
}

// Icon lookup for data-driven icons (achievements).
export function NamedIcon({ name, size = 20, ...rest }) {
  const C = NAMED[name] ?? Star;
  return <C size={size} strokeWidth={2} {...rest} />;
}

// Lifeline glyphs for the show's round badges.
export function LifelineGlyph({ type, size = 28 }) {
  switch (type) {
    case "fifty":
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor">
          <text x="16" y="21" textAnchor="middle" fontFamily="Rajdhani, sans-serif" fontWeight="700" fontSize="14">
            50:50
          </text>
        </svg>
      );
    case "poll":
      return <Users size={size * 0.8} strokeWidth={2} />;
    case "phone":
      return <PhoneCall size={size * 0.76} strokeWidth={2} />;
    case "expert":
      return <GraduationCap size={size * 0.82} strokeWidth={2} />;
    case "flip":
      return <RefreshCcw size={size * 0.76} strokeWidth={2.2} />;
    default:
      return null;
  }
}
