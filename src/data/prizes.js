// KBC prize ladder (16 questions). Milestones ("padaav") at Q5 and Q10 are guaranteed;
// crossing Q15 is not — missing the ₹7 crore jackpot drops you back to ₹3,20,000.
export const LADDER = [
  { level: 1, amount: 1000 },
  { level: 2, amount: 2000 },
  { level: 3, amount: 3000 },
  { level: 4, amount: 5000 },
  { level: 5, amount: 10000, milestone: true },
  { level: 6, amount: 20000 },
  { level: 7, amount: 40000 },
  { level: 8, amount: 80000 },
  { level: 9, amount: 160000 },
  { level: 10, amount: 320000, milestone: true },
  { level: 11, amount: 640000 },
  { level: 12, amount: 1250000 },
  { level: 13, amount: 2500000 },
  { level: 14, amount: 5000000 },
  { level: 15, amount: 10000000, crore: true },
  { level: 16, amount: 70000000, jackpot: true },
];

export const TOTAL_LEVELS = LADDER.length;
export const FLIP_UNLOCK_AFTER = 5; // "Flip the Question" unlocks once the first padaav is crossed

export const amountFor = (level) => (level >= 1 ? LADDER[level - 1].amount : 0);

// Money kept if the answer to `level` is wrong.
export function safeAmount(level) {
  let safe = 0;
  for (const step of LADDER) if (step.milestone && step.level < level) safe = step.amount;
  return safe;
}

export function timeLimitFor(level, mode = "classic") {
  if (mode === "off" || level > 10) return null;
  const base = level <= 5 ? 45 : 60;
  return mode === "relaxed" ? Math.round(base * 1.5) : base;
}

// Suspense before the reveal grows with the stakes.
export function suspenseMs(level) {
  if (level <= 3) return 1300;
  if (level <= 5) return 1900;
  if (level <= 10) return 2800;
  if (level <= 14) return 4000;
  return 5600;
}

export function stageFor(level) {
  if (level <= 5) return "easy";
  if (level <= 10) return "medium";
  if (level <= 14) return "hard";
  return "final";
}
