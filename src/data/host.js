// The host's script. Each line has a Hinglish version (the show's voice) and plain English.
// `say` is the text spoken when host narration is on (always English so TTS sounds natural).
import { pick } from "../lib/random";
import { shortINR } from "../lib/format";

const L = (hi, en, say = en) => ({ hi, en, say });

export const host = {
  welcome: (name, city) =>
    pick([
      L(
        `Deviyon aur Sajjanon! Hot seat par swagat kijiye — ${name}${city ? `, ${city} se` : ""}!`,
        `Ladies and gentlemen, please welcome to the hot seat — ${name}${city ? ` from ${city}` : ""}!`
      ),
      L(
        `Namaskar ${name}! Kaun Banega Crorepati mein aapka swagat hai.`,
        `Namaskar ${name}! Welcome to Kaun Banega Crorepati.`
      ),
    ]),
  rules: () =>
    L(
      "16 sawaal, 2 padaav, aur aapke paas hain chaar lifelines. Chaliye, khel shuru karte hain!",
      "Sixteen questions, two milestones and four lifelines. Let's begin!"
    ),
  question: (level, amount) => {
    if (level === 16) return L("Saat... Crore... ka sawaal! Yeh raha aapki screen par.", "The seven crore question. Here it is on your screen.");
    if (level === 15) return L(`Ek Crore rupaye ke liye — sawaal number 15!`, `For one crore rupees — question number 15!`);
    return pick([
      L(`Sawaal number ${level}, ${shortINR(amount)} ke liye. Yeh raha aapki screen par.`, `Question ${level}, for ${shortINR(amount)}. Here it is on your screen.`),
      L(`${shortINR(amount)} ke liye, aapka ${ordinalHi(level)} sawaal.`, `For ${shortINR(amount)}, your question number ${level}.`),
    ]);
  },
  pick: () =>
    pick([
      L("Soch samajh kar jawab dijiye.", "Take your time and think it through."),
      L("Aaram se. Koi jaldi nahi hai.", "Relax. There's no hurry."),
      L("Aapka jawab kya hai?", "What's your answer?"),
    ]),
  confirm: (letter) => L(`Option ${letter}? Lock kiya jaye?`, `Option ${letter}? Shall we lock it?`),
  locked: (letter) =>
    pick([
      L(`Computer ji, option ${letter} lock kiya jaye.`, `Computer, please lock option ${letter}.`),
      L(`Option ${letter} — lock kar diya gaya hai.`, `Option ${letter} is locked in.`),
    ]),
  correct: (amount) =>
    pick([
      L(`Sahi jawab! Aap jeet chuke hain ${shortINR(amount)}!`, `Correct answer! You have won ${shortINR(amount)}!`),
      L(`Bilkul sahi! ${shortINR(amount)} ab aapke hain.`, `Absolutely right! ${shortINR(amount)} is yours.`),
      L(`Ekdum sahi jawab! ${shortINR(amount)}!`, `Spot on! ${shortINR(amount)}!`),
    ]),
  wrong: (safe) =>
    safe
      ? L(`Afsos... yeh galat jawab hai. Lekin aap ${shortINR(safe)} lekar ja rahe hain.`, `Oh no, that's the wrong answer. But you still take home ${shortINR(safe)}.`)
      : L("Afsos... yeh galat jawab hai.", "I'm so sorry, that's the wrong answer."),
  milestone: (level, amount) =>
    level === 5
      ? L(`Pehla padaav paar! ${shortINR(amount)} ab aapse koi nahi chheen sakta.`, `First milestone crossed! Nobody can take ${shortINR(amount)} away from you now.`)
      : L(`Doosra padaav! ${shortINR(amount)} pakke ho gaye.`, `Second milestone! ${shortINR(amount)} is now guaranteed.`),
  flipUnlocked: () => L("Badhai ho! 'Flip the Question' lifeline ab khul gayi hai.", "Congratulations! The 'Flip the Question' lifeline is now unlocked."),
  crore: () => L("EK... CRORE! Aap crorepati ban gaye hain!", "ONE CRORE! You are a crorepati!", "One crore! You are a crorepati!"),
  jackpot: () => L("SAAT... CRORE!! Itihaas rach diya aapne!", "SEVEN CRORE! You've made history!", "Seven crore! You have made history!"),
  jackpotWarn: () =>
    L(
      "Dhyan rahe — galat jawab par aap ₹3,20,000 par aa jayenge. Khelenge ya quit karenge?",
      "Remember — a wrong answer drops you to ₹3,20,000. Will you play or walk away?"
    ),
  timeUp: (amount) => L(`Samay samaapt! Aap ${shortINR(amount)} lekar ja rahe hain.`, `Time's up! You leave with ${shortINR(amount)}.`),
  quitAsk: (amount) => L(`Kya aap ${shortINR(amount)} lekar quit karna chahte hain?`, `Do you want to walk away with ${shortINR(amount)}?`),
  quitGuess: () => L("Game quit ho chuka hai. Bas bataiye — aap kaunsa option chunte?", "You've walked away. Just for fun — which option would you have picked?"),
  guessResult: (right) =>
    right
      ? L("Arre! Aapka jawab sahi hota!", "Oh! You would have been right!")
      : L("Sahi faisla! Aapka jawab galat hota.", "Wise decision! That would have been wrong."),
  lifeline: {
    fifty: () => L("Computer ji, do galat jawab hata dijiye.", "Computer, please remove two wrong answers."),
    poll: () => L("Audience, apne keypad uthaiye aur vote kijiye!", "Audience, pick up your keypads and vote now!"),
    phone: (name) => L(`Chaliye, ${name} ko phone lagate hain.`, `Let's call ${name}.`),
    expert: () => L("Hamare expert se poochte hain.", "Let's ask our expert."),
    flip: () => L("Naya sawaal, usi rakam ke liye!", "A brand new question for the same amount!"),
  },
  favTopic: (cat) => L(`Aapka pasandeeda vishay — ${cat}!`, `Your favourite topic — ${cat}!`),
  streak: () =>
    pick([
      L("Kya baat hai! Aap toh aag laga rahe hain!", "Wow! You're on fire!"),
      L("Shandaar khel!", "Brilliant play!"),
    ]),
  breather: () => L("Thoda saans lijiye. Agla sawaal aapke liye.", "Take a breath. Here comes your next one."),
};

function ordinalHi(n) {
  return `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
}

export const lineText = (line, language) => (language === "english" ? line.en : line.hi);
