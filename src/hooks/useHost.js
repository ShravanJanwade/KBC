import { useMemo, useRef } from "react";
import { useApp } from "../state/AppContext";
import { cancelSpeech, hostWho, speakEnglish, speakLine, speechSupported } from "../audio/speech";
import { lineText } from "../data/host";

// The host's voice for screens outside the hot seat. Every call resolves when he stops talking
// (immediately when narration is switched off), so callers can sequence around him.
export function useHost() {
  const { settings } = useApp();
  const ref = useRef(settings);
  ref.current = settings;
  return useMemo(
    () => ({
      on: () => !!ref.current.hostVoice && speechSupported,
      say: (line, mood) => (ref.current.hostVoice && line ? speakLine(line, hostWho(), { language: ref.current.language, mood }) : Promise.resolve()),
      read: (text, mood) => (ref.current.hostVoice && text ? speakEnglish(text, hostWho(), { mood }) : Promise.resolve()),
      text: (line) => (line ? lineText(line, ref.current.language) : ""),
      stop: cancelSpeech,
    }),
    []
  );
}
