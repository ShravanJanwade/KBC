import { useEffect, useRef, useState } from "react";
import { Mic, Square, Play, Upload, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui";
import { VOICE_MOMENTS } from "../data/voicePack";
import { loadClips, saveClip, deleteClip } from "../lib/clipStore";
import { setClip, playClip, cancelSpeech } from "../audio/speech";
import { audio } from "../audio/engine";
import { sfx } from "../audio/synth";

const MAX_SECONDS = 12;
const MIME = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];

// Record (or import) your own clips for the host's signature moments. A recorded moment plays
// your clip instead of the synthesised voice. Everything stays in this browser.
export default function VoicePack() {
  const [have, setHave] = useState(() => new Set());
  const [recording, setRecording] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);
  const rec = useRef(null);

  useEffect(() => {
    loadClips().then((m) => setHave(new Set(m.keys())));
    return () => rec.current?.mr.state === "recording" && rec.current.mr.stop();
  }, []);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setElapsed((performance.now() - recording.started) / 1000), 100);
    return () => clearInterval(id);
  }, [recording]);

  const store = async (id, blob) => {
    await saveClip(id, blob);
    setClip(id, blob);
    setHave((s) => new Set(s).add(id));
  };

  const start = async (id) => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return setError("This browser can't record audio — use Import instead.");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const type = MIME.find((t) => MediaRecorder.isTypeSupported?.(t)) ?? "";
      const mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      const chunks = [];
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        clearTimeout(rec.current?.auto);
        audio.unduck();
        setRecording(null);
        if (chunks.length) {
          await store(id, new Blob(chunks, { type: mr.mimeType || type || "audio/webm" }));
          sfx.ding();
        }
      };
      cancelSpeech();
      audio.duck(0.08);
      mr.start();
      rec.current = { mr, auto: setTimeout(() => mr.state === "recording" && mr.stop(), MAX_SECONDS * 1000) };
      setElapsed(0);
      setRecording({ id, started: performance.now() });
    } catch (e) {
      setError(e?.name === "NotAllowedError" ? "Microphone permission was denied." : "Couldn't open a microphone.");
    }
  };

  const stop = () => rec.current?.mr.state === "recording" && rec.current.mr.stop();

  const importFile = async (id, file) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("audio/")) return setError("Please choose an audio file.");
    if (file.size > 5_000_000) return setError("Please keep clips under 5 MB.");
    await store(id, file);
    sfx.ding();
  };

  const remove = async (id) => {
    await deleteClip(id);
    setClip(id, null);
    setHave((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  };

  return (
    <div className="vp">
      <p className="vp__intro">
        Record your own host — or a family member's best impression — for the show's signature moments, with all the drama you like. Recorded moments play your clip instead of the computer voice.
        Clips stay in this browser. <b className="t-gold">{have.size}</b> of {VOICE_MOMENTS.length} recorded.
      </p>
      {error && <div className="vp__error">{error}</div>}
      <ul className="vp__list">
        {VOICE_MOMENTS.map((m) => {
          const isRec = recording?.id === m.id;
          const done = have.has(m.id);
          return (
            <li key={m.id} className={`vp__row${done ? " is-done" : ""}${isRec ? " is-rec" : ""}`}>
              <span className="vp__state">{done ? <CheckCircle2 size={16} /> : <span className="vp__dot" />}</span>
              <span className="vp__text">
                <b>{m.label}</b>
                <i>“{m.script}”</i>
              </span>
              <span className="vp__actions">
                {isRec ? (
                  <Button variant="danger" size="sm" icon={Square} onClick={stop} quiet>
                    Stop · {elapsed.toFixed(1)}s
                  </Button>
                ) : (
                  <Button variant="glass" size="sm" icon={Mic} onClick={() => start(m.id)} disabled={!!recording} quiet>
                    {done ? "Re-record" : "Record"}
                  </Button>
                )}
                <label className={`btn btn--ghost btn--sm vp__import${recording ? " is-disabled" : ""}`} title="Import an audio file">
                  <Upload size={15} />
                  <input type="file" accept="audio/*" hidden disabled={!!recording} onChange={(e) => importFile(m.id, e.target.files?.[0])} />
                </label>
                <Button variant="ghost" size="sm" icon={Play} aria-label={`Play ${m.label}`} disabled={!done || !!recording} onClick={() => playClip(m.id)} quiet />
                <Button variant="ghost" size="sm" icon={Trash2} aria-label={`Remove ${m.label}`} disabled={!done || !!recording} onClick={() => remove(m.id)} quiet />
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
