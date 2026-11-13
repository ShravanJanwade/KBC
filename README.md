# Kaun Banega Crorepati

A TV-quality recreation of KBC, the Indian *Who Wants to Be a Millionaire*, built with React and Vite. Climb 16 questions to ₹7 crore with a fully narrating host, Fastest Finger First, five lifelines and difficulty that adapts to you.

## Run it

```bash
npm install
npm run dev
```

Open the printed URL. **For the most natural voices, use Microsoft Edge.** Edge ships Microsoft's neural voices, including the natural Hindi host voice (Madhur). Other browsers fall back to whatever voices the operating system has installed.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build into `dist/` |
| `npm run lint` | ESLint (zero warnings allowed) |
| `npm run validate` | Check every question bank file |

## What's in the game

- **The show, end to end.** Cinematic intro, main menu, Fastest Finger First against nine rivals, the hot seat, padaav (₹10,000 and ₹3,20,000) celebrations, the ₹1 crore moment and the ₹7 crore jackpot decision. A wrong jackpot answer drops you to ₹3,20,000.
- **A host who narrates everything.** He welcomes you and introduces each question, then reads it and every option as it appears, and starts the clock. He also asks "Lock kiya jaye?", whispers during the suspense, announces the result with the amount in words, and voices the lifelines, milestones, walking away and the prize transfer. His lines are written in Hinglish, Devanagari and English, so a Hindi voice delivers them naturally. Press **Space** to skip any narration.
- **Lifelines.**
  - 50:50
  - Audience Poll: a crowd model that hard questions can fool
  - Phone a Friend: a smartphone with DTMF dialling, the Indian ring-back tone, live captions, and six friends with their own expertise and voices
  - Ask the Expert: a live video call with spoken reasoning
  - Flip the Question: unlocks after the first padaav
- **Adaptive difficulty.** An IRT/Elo player rating (your *Quiz IQ*), overall and per topic, sets each question's difficulty for the prize level. You won't see a repeat question until you've seen the whole bank.
- **Topics you choose.** Set each of 20 topics from Off to Max, or use a preset. A live donut shows the resulting mix.
- **Payout.** Winnings arrive as an animated UPI transfer on a tablet from the game's fictional *Bharat Gyaan Bank*.
- **Progress.**
  - Multiple players per device
  - History with per-question replays
  - Quiz IQ trend
  - Per-topic accuracy
  - A strengths radar
  - 16 achievements
  - A local leaderboard

## Voices

Open **Settings → Voices & narration** to:
- turn narration on or off
- adjust the speaking pace
- pick the host's Hindi and English voices, or leave them on automatic
- preview the host, a friend and the expert

The status line there tells you whether natural voices were found.

**Host Voice Pack.** In **Settings → Host voice pack** you can record your own clips, or import audio files, for 24 signature moments such as "Lock kiya jaye?", "Saat... crore!" and "Ye gaye paise aapke account mein!". A recorded moment plays your clip instead of the computer voice. Clips are stored only in your browser (IndexedDB).

## Question bank

There are **1,000 questions** across 20 topics (50 each, spread over difficulty 1–10) plus **80 Fastest Finger First** ordering questions. They live in `src/data/questions/<topic>.js`. In each question `o[0]` is the correct answer; the game shuffles options at runtime and sorts them when they're all numbers.

```js
{ id: "geo-001", d: 1, q: "Which is the longest river in India?", o: ["Ganga", "Yamuna", "Narmada", "Krishna"], f: "The Ganga flows about 2,525 km…" }
```

`npm run validate` checks ids, lengths, duplicates (across all files) and the difficulty distribution.

## Project layout

```
src/
  audio/      engine (music buses, ducking), synth (Web Audio SFX), speech (voice casting & delivery)
  components/ stage, logo, lozenge, avatar builder, UPI tablet, celebration canvas, charts, UI kit
  data/       categories, prize ladder, host script, friends & rivals, achievements, voice-pack moments
  engine/     rating (Quiz IQ), adaptive question selector, lifeline AI
  screens/    splash, onboarding, menu, topics, history, profile, settings, how-to, FFF, hot seat, result
  state/      profiles, settings, history and seen-question persistence (localStorage)
```

The recorded music and stings in `src/assets/audio` came with the original project.
