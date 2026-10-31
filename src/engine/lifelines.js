// How the lifelines "think". All of them are honest simulations — never peeking at the answer
// directly — so a hard question can genuinely mislead the audience or stump a friend.
import { pCorrect } from "./rating";
import { chance, clamp, gaussian, pick, rand, roundToTotal, shuffle } from "../lib/random";

const ALL = [0, 1, 2, 3];
const alive = (removed) => ALL.filter((i) => !removed.includes(i));

export function fiftyFifty(answer, removed = []) {
  return shuffle(alive(removed).filter((i) => i !== answer)).slice(0, 2);
}

// Share of the studio audience that actually knows the answer, by difficulty 1-10.
const KNOWERS = [0, 0.93, 0.86, 0.78, 0.7, 0.61, 0.52, 0.43, 0.34, 0.26, 0.19];

export function audiencePoll({ answer, d, removed = [] }) {
  const open = alive(removed);
  const know = clamp(KNOWERS[d] + gaussian() * 0.05, 0.08, 0.97);
  const guesses = open.map(() => 0.4 + Math.random());
  // On tough questions a popular misconception can sway the room.
  if (d >= 6 && chance(d >= 8 ? 0.35 : 0.18)) {
    const decoy = open.filter((i) => i !== answer);
    if (decoy.length) guesses[open.indexOf(pick(decoy))] += 1.6 + Math.random();
  }
  const total = guesses.reduce((a, b) => a + b, 0);
  const shares = [0, 0, 0, 0];
  open.forEach((i, k) => {
    shares[i] = (1 - know) * (guesses[k] / total) + (i === answer ? know : 0);
  });
  return roundToTotal(shares, 100);
}

export function friendAnswer(friend, { answer, d, c, removed = [] }) {
  const theta = friend.strengths.includes(c) ? friend.expert : friend.general;
  const open = alive(removed);
  if (chance(pCorrect(theta, d))) {
    return { index: answer, confidence: Math.round(clamp(rand(80, 97) - Math.max(0, d - 5) * 2, 66, 97)), mood: "sure" };
  }
  const wrong = open.filter((i) => i !== answer);
  const halfRemembered = chance(0.38) || !wrong.length;
  const confidence = Math.round(rand(22, 55));
  return { index: halfRemembered ? answer : pick(wrong), confidence, mood: confidence < 35 ? "clueless" : "unsure" };
}

export function expertAnswer(expert, { answer, d, removed = [] }) {
  if (chance(pCorrect(expert.ability, d))) {
    return { index: answer, confidence: Math.round(clamp(rand(86, 98) - Math.max(0, d - 6) * 3, 72, 98)), knows: true };
  }
  const wrong = alive(removed).filter((i) => i !== answer);
  const lean = chance(0.4) || !wrong.length ? answer : pick(wrong);
  return { index: lean, confidence: Math.round(rand(40, 62)), knows: false };
}

// Fastest Finger First rivals. A mild rubber band keeps it winnable: a correct player is beaten
// ~1 in 4 times in round 1, rarely in round 2, never in round 3.
export function simulateFFF({ rivals, round, playerCorrect, playerTimeMs }) {
  const results = rivals.map((r) => ({
    id: r.id,
    correct: chance(r.accuracy),
    timeMs: Math.round(clamp(r.speed * Math.exp(gaussian() * 0.3), 3.2, 19.6) * 1000),
  }));
  const correct = results.filter((r) => r.correct);
  if (correct.length < 2) shuffle(results.filter((r) => !r.correct)).slice(0, 2 - correct.length).forEach((r) => (r.correct = true));

  if (playerCorrect) {
    const beatChance = [0.25, 0.1, 0][Math.min(round, 3) - 1];
    const faster = results.filter((r) => r.correct && r.timeMs < playerTimeMs);
    if (chance(beatChance)) {
      if (!faster.length) {
        const r = pick(results.filter((x) => x.correct));
        r.timeMs = Math.max(1800, Math.round(playerTimeMs * rand(0.8, 0.97)));
      }
    } else {
      faster.forEach((r) => (r.timeMs = Math.min(19900, Math.round(playerTimeMs + rand(180, 2600)))));
    }
  }
  return results;
}
