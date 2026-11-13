import { useEffect, useState } from "react";
import { Mic, Phone, Languages, Gauge, Play, CheckCircle2, AlertTriangle, GraduationCap, UserRound, ExternalLink, Users } from "lucide-react";
import { Button, Range, Segmented, Toggle } from "../components/ui";
import { audio } from "../audio/engine";
import { getVoices, onVoicesChanged, voiceQuality, isNatural, hostVoices, hostWho, speakLine, speakEnglish, speechSupported, isEdge } from "../audio/speech";
import { EXPERT, FRIENDS } from "../data/people";
import { host } from "../data/host";

const QUALITY = {
  natural: { ok: true, text: "Natural Indian voices found — the host and lifelines will sound studio-quality." },
  good: { ok: true, text: "Natural voices found, though none with an Indian accent. For the best KBC feel, play in Microsoft Edge." },
  basic: { ok: false, text: "Only basic voices are installed. For natural voices open the game in Microsoft Edge, or add Hindi and English (India) voices in Windows Settings → Time & language → Speech." },
  none: { ok: false, text: "Your browser has no speech voices, so lines appear as captions only." },
};

export default function VoiceSettings({ settings, set, Row }) {
  const [voices, setVoices] = useState(getVoices);
  useEffect(() => onVoicesChanged(setVoices), []);

  const quality = QUALITY[speechSupported ? voiceQuality() : "none"];
  const hi = voices.filter((v) => /^hi/i.test(v.lang));
  const en = voices.filter((v) => /^en/i.test(v.lang)).sort((a, b) => Number(/en[-_]in/i.test(b.lang)) - Number(/en[-_]in/i.test(a.lang)));
  const auto = hostVoices();
  const hiNatural = hi.some((v) => isNatural(v) && !/female|swara/i.test(v.name));
  const label = (v) => `${isNatural(v) ? "★ " : ""}${v.name.replace(/^Microsoft /, "").replace(/ Online \(Natural\)/, " (Natural)")} — ${v.lang}`;

  const preview = (who) => {
    audio.unlock();
    if (who === "host") speakLine(host.splash(), hostWho(), { language: settings.language });
    if (who === "friend") {
      const f = FRIENDS.find((x) => x.id === "dadi");
      speakLine(f.greeting, f.voice, { language: settings.language });
    }
    if (who === "expert") speakEnglish("I'm quite confident about this one.| The answer is B.", EXPERT.voice);
  };

  return (
    <>
      <div className={`voice-status${quality.ok ? " is-ok" : ""}`}>
        {quality.ok ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
        <span>
          {quality.text}
          {!hiNatural && !isEdge() && (
            <>
              {" "}
              <a className="voice-status__link" href={`microsoft-edge:${window.location.href}`}>
                Open in Microsoft Edge <ExternalLink size={12} />
              </a>{" "}
              for the natural Hindi host (Madhur).
            </>
          )}
        </span>
      </div>
      <Row icon={Mic} label="Host narrates everything" hint="Questions, options, locks, results and every dialogue in between.">
        <Toggle checked={settings.hostVoice} onChange={(hostVoice) => set({ hostVoice })} label="Host narration" />
      </Row>
      <Row icon={Phone} label="Friends & expert speak" hint="Natural voices for Phone a Friend and Ask the Expert.">
        <Toggle checked={settings.lifelineVoice} onChange={(lifelineVoice) => set({ lifelineVoice })} label="Lifeline voices" />
      </Row>
      <Row icon={Languages} label="Host language" hint="Hinglish uses a Hindi voice when one is installed.">
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
      <Row icon={Users} label="One consistent host voice" hint="A natural Hindi voice also reads the English questions and options, with an Indian accent.">
        <Toggle checked={settings.hostOneVoice} onChange={(hostOneVoice) => set({ hostOneVoice })} label="One host voice" />
      </Row>
      <Row icon={Gauge} label="Speaking pace">
        <Range value={settings.speechRate} min={0.8} max={1.2} step={0.05} onChange={(speechRate) => set({ speechRate })} label="Speaking pace" />
      </Row>
      {speechSupported && (
        <>
          <Row icon={UserRound} label="Host voice — Hindi" hint={`Automatic: ${auto.hi ? label(auto.hi) : "none installed (English is used)"}`}>
            <select className="select" value={settings.hostVoiceHi} onChange={(e) => set({ hostVoiceHi: e.target.value })} aria-label="Host Hindi voice">
              <option value="">Automatic (best)</option>
              {hi.map((v) => (
                <option key={v.name} value={v.name}>
                  {label(v)}
                </option>
              ))}
            </select>
          </Row>
          <Row icon={UserRound} label="Host voice — English" hint={`Automatic: ${auto.en ? label(auto.en) : "none"}`}>
            <select className="select" value={settings.hostVoiceEn} onChange={(e) => set({ hostVoiceEn: e.target.value })} aria-label="Host English voice">
              <option value="">Automatic (best)</option>
              {en.map((v) => (
                <option key={v.name} value={v.name}>
                  {label(v)}
                </option>
              ))}
            </select>
          </Row>
          <div className="set__test">
            <Button variant="glass" size="sm" icon={Play} onClick={() => preview("host")}>
              Hear the host
            </Button>
            <Button variant="glass" size="sm" icon={Phone} onClick={() => preview("friend")}>
              Hear a friend
            </Button>
            <Button variant="glass" size="sm" icon={GraduationCap} onClick={() => preview("expert")}>
              Hear the expert
            </Button>
          </div>
        </>
      )}
    </>
  );
}
