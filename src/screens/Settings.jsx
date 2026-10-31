import { useState } from "react";
import { Volume2, Music, Sparkles, Mic, Phone, Timer, Lock, Zap, Gauge, Languages, Accessibility, Database, Trash2, RotateCcw, Play } from "lucide-react";
import { BackButton, Button, Modal, Range, Segmented, Toggle } from "../components/ui";
import { useStageMood } from "../components/Stage";
import { useApp } from "../state/AppContext";
import { QUESTIONS } from "../data/questions";
import { sfx } from "../audio/synth";
import { audio } from "../audio/engine";
import { say, speechSupported } from "../audio/speech";
import "../styles/pages.css";

const DIFFICULTY = [
  { value: "adaptive", label: "Adaptive", desc: "Questions match your Quiz IQ and get tougher up the ladder. Recommended." },
  { value: "classic", label: "Classic", desc: "The standard TV curve for everyone, ignoring your rating." },
  { value: "easy", label: "Relaxed", desc: "Adaptive, but a notch gentler — great for family play." },
  { value: "hard", label: "Mastermind", desc: "Adaptive, but a notch tougher. Bring your A-game." },
];

export default function Settings({ onBack }) {
  useStageMood("menu");
  const { settings, updateSettings, seen, resetSeen, profile, clearHistory, resetEverything } = useApp();
  const [confirm, setConfirm] = useState(null);
  const seenCount = QUESTIONS.filter((q) => seen[q.id]).length;
  const set = (patch) => updateSettings(patch);

  const testVoice = () => {
    audio.unlock();
    say(settings.language === "english" ? `Welcome to Kaun Banega Crorepati, ${profile?.name ?? ""}!` : `Namaskar ${profile?.name ?? ""}! Kaun Banega Crorepati mein aapka swagat hai.`, { gender: "male", pitch: 0.92 });
  };

  const actions = {
    seen: { title: "Reset fresh questions?", text: "Every question becomes 'fresh' again, so you may see ones you've already answered.", run: resetSeen, label: "Reset" },
    history: { title: "Clear game history?", text: `This removes ${profile?.name}'s game history. Quiz IQ and achievements stay.`, run: clearHistory, label: "Clear history" },
    all: { title: "Delete everything?", text: "All players, histories, ratings and settings on this device will be erased. This can't be undone.", run: resetEverything, label: "Delete everything" },
  };

  return (
    <div className="page settings">
      <header className="page__head">
        <BackButton onClick={onBack} />
        <div>
          <h1 className="page__title t-gold">Settings</h1>
          <p className="page__sub">Sound, voices, gameplay and data.</p>
        </div>
      </header>

      <div className="page__body scroll">
        <div className="set__grid">
          <section className="set__card card">
            <h2 className="section-title">Sound</h2>
            <Row icon={Volume2} label="Master volume">
              <Range value={settings.master} onChange={(master) => set({ master, muted: false })} onCommit={() => sfx.coin()} label="Master volume" />
            </Row>
            <Row icon={Music} label="Music">
              <Range value={settings.music} onChange={(music) => set({ music })} onCommit={() => audio.music("theme")} label="Music volume" />
            </Row>
            <Row icon={Sparkles} label="Sound effects">
              <Range value={settings.sfx} onChange={(v) => set({ sfx: v })} onCommit={() => sfx.ding()} label="Effects volume" />
            </Row>
            <Row icon={Volume2} label="Mute everything">
              <Toggle checked={settings.muted} onChange={(muted) => set({ muted })} label="Mute" />
            </Row>
          </section>

          <section className="set__card card">
            <h2 className="section-title">Voices</h2>
            <Row icon={Mic} label="Host reads questions aloud" hint={speechSupported ? "Uses your browser's text-to-speech voices." : "Your browser doesn't support speech."}>
              <Toggle checked={settings.hostVoice} onChange={(hostVoice) => set({ hostVoice })} label="Host voice" />
            </Row>
            <Row icon={Phone} label="Friends & expert speak" hint="Voices for Phone a Friend and Ask the Expert.">
              <Toggle checked={settings.lifelineVoice} onChange={(lifelineVoice) => set({ lifelineVoice })} label="Lifeline voices" />
            </Row>
            <Row icon={Languages} label="Host language">
              <Segmented
                value={settings.language}
                onChange={(language) => set({ language })}
                label="Host language"
                options={[
                  { value: "hinglish", label: "Hinglish" },
                  { value: "english", label: "English" },
                ]}
              />
            </Row>
            {speechSupported && (
              <div className="set__test">
                <Button variant="glass" size="sm" icon={Play} onClick={testVoice}>
                  Test the host voice
                </Button>
              </div>
            )}
          </section>

          <section className="set__card card set__card--wide">
            <h2 className="section-title">Gameplay</h2>
            <Row icon={Gauge} label="Difficulty" hint={DIFFICULTY.find((d) => d.value === settings.difficulty)?.desc}>
              <Segmented value={settings.difficulty} onChange={(difficulty) => set({ difficulty })} label="Difficulty" options={DIFFICULTY.map(({ value, label }) => ({ value, label }))} />
            </Row>
            <Row icon={Timer} label="Clock" hint="Classic: 45s for Q1–5, 60s for Q6–10, no clock after that.">
              <Segmented
                value={settings.timerMode}
                onChange={(timerMode) => set({ timerMode })}
                label="Clock"
                options={[
                  { value: "classic", label: "Classic" },
                  { value: "relaxed", label: "Relaxed +50%" },
                  { value: "off", label: "Off" },
                ]}
              />
            </Row>
            <Row icon={Lock} label='Ask "Lock kiya jaye?" before locking' hint="Turn off to lock an answer with a single click.">
              <Toggle checked={settings.confirmLock} onChange={(confirmLock) => set({ confirmLock })} label="Confirm lock" />
            </Row>
            <Row icon={Zap} label="Play Fastest Finger First" hint="Race 9 rivals to reach the hot seat before each game.">
              <Toggle checked={settings.fff} onChange={(fff) => set({ fff })} label="Fastest Finger First" />
            </Row>
          </section>

          <section className="set__card card">
            <h2 className="section-title">Display</h2>
            <Row icon={Accessibility} label="Reduce motion" hint="Tones down animations and camera moves.">
              <Toggle checked={settings.reducedMotion} onChange={(reducedMotion) => set({ reducedMotion })} label="Reduce motion" />
            </Row>
          </section>

          <section className="set__card card">
            <h2 className="section-title">Data</h2>
            <Row icon={Database} label="Questions seen" hint={`${seenCount} of ${QUESTIONS.length} seen by ${profile?.name}. Seen questions only come back once fresh ones run out.`}>
              <Button variant="glass" size="sm" icon={RotateCcw} onClick={() => setConfirm("seen")} disabled={!seenCount}>
                Reset
              </Button>
            </Row>
            <Row icon={Trash2} label="Game history">
              <Button variant="glass" size="sm" icon={Trash2} onClick={() => setConfirm("history")}>
                Clear
              </Button>
            </Row>
            <Row icon={Trash2} label="Everything on this device">
              <Button variant="danger" size="sm" icon={Trash2} onClick={() => setConfirm("all")}>
                Delete all
              </Button>
            </Row>
          </section>
        </div>
      </div>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} size="sm" label="Confirm">
        {confirm && (
          <div className="dialog glass glass--gold">
            <h2 className="dialog__title">{actions[confirm].title}</h2>
            <p className="dialog__text">{actions[confirm].text}</p>
            <div className="dialog__actions">
              <Button variant="glass" onClick={() => setConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  actions[confirm].run();
                  setConfirm(null);
                }}
              >
                {actions[confirm].label}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ icon: Icon, label, hint, children }) {
  return (
    <div className="set__row">
      <span className="set__icon">
        <Icon size={17} />
      </span>
      <span className="set__label">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </span>
      <span className="set__control">{children}</span>
    </div>
  );
}
