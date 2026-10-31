import { pick, randInt, chance } from "../lib/random";

export const SKIN = ["#f8d9bd", "#eec29b", "#d8a074", "#bd8155", "#97623e", "#6c4329"];
export const HAIR_COLORS = ["#17110d", "#3a2316", "#5c3a1f", "#8b5a2b", "#b9b6b0", "#7a1f1f"];
export const OUTFIT_COLORS = ["#e2474b", "#f59e0b", "#1fa463", "#2f6bff", "#7c3aed", "#db2777", "#0f8b8d", "#334155", "#f1f5f9"];
export const BACKGROUNDS = [
  ["#7c4dff", "#2b1491"],
  ["#22b7f2", "#1e3a8a"],
  ["#ffb020", "#b0470b"],
  ["#22c58b", "#06604a"],
  ["#ff5fa2", "#8f1450"],
  ["#8a94b8", "#232a45"],
];
export const HAIR_STYLES = ["short", "side", "spiky", "curly", "long", "bob", "bun", "ponytail", "bald", "turban"];
export const OUTFITS = ["kurta", "blazer", "tee", "saree", "hoodie"];
export const BEARDS = ["none", "stubble", "mustache", "full"];

export function randomAvatar() {
  const hair = pick(HAIR_STYLES);
  const feminine = ["long", "bob", "bun", "ponytail"].includes(hair);
  return {
    skin: randInt(0, SKIN.length - 1),
    hair,
    hairColor: chance(0.75) ? randInt(0, 2) : randInt(0, HAIR_COLORS.length - 1),
    outfit: feminine && chance(0.4) ? "saree" : pick(["kurta", "blazer", "tee", "hoodie"]),
    outfitColor: randInt(0, OUTFIT_COLORS.length - 1),
    bg: randInt(0, BACKGROUNDS.length - 1),
    glasses: chance(0.25),
    bindi: feminine && chance(0.35),
    earrings: feminine && chance(0.5),
    beard: !feminine && chance(0.4) ? pick(["stubble", "mustache", "full"]) : "none",
  };
}
