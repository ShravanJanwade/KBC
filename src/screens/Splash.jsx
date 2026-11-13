import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Headphones } from "lucide-react";
import Logo from "../components/Logo";
import { useStage, useStageMood } from "../components/Stage";
import { audio } from "../audio/engine";
import { sfx } from "../audio/synth";
import { useHost } from "../hooks/useHost";
import { host } from "../data/host";
import { sleep } from "../lib/random";
import "../styles/screens.css";

const TITLE = ["कौन", "बनेगा", "करोड़पति"];

export default function Splash({ onDone }) {
  const [phase, setPhase] = useState("gate");
  const { flash } = useStage();
  const voice = useHost();
  const done = useRef(false);
  useStageMood(phase === "gate" ? "dark" : "celebrate");

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  const enter = () => {
    if (phase !== "gate") return finish();
    audio.unlock();
    audio.preload(["theme", "letsPlay", "bedEasy", "correct", "wrong", "suspense"]);
    audio.music("theme", { fade: 0.3 });
    sfx.boom();
    sfx.whoosh("up", 0.9);
    flash("white");
    setPhase("intro");
  };

  useEffect(() => {
    const onKey = () => enter();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (phase !== "intro") return;
    let gone = false;
    const t1 = setTimeout(() => sfx.sparkle(16, 1.2), 1500);
    // "Deviyon aur Sajjanon..." lands as the title settles; move on once the host has finished.
    const t2 = setTimeout(() => {
      Promise.all([voice.say(host.splash(), "dramatic"), sleep(3600)]).then(() => !gone && setTimeout(finish, 450));
    }, 1600);
    const t3 = setTimeout(finish, voice.on() ? 11000 : 5600);
    return () => {
      gone = true;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div className="splash" onClick={enter} role="button" tabIndex={-1} aria-label="Enter the game">
      {phase === "gate" ? (
        <motion.div className="splash__gate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
          <motion.div animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <Logo size="min(62vmin, 440px)" spin={false} className="splash__logo-dim" />
          </motion.div>
          <div className="splash__press">Press any key or tap to enter the studio</div>
          <div className="splash__hint">
            <Headphones size={16} /> Best experienced with sound on
          </div>
        </motion.div>
      ) : (
        <div className="splash__intro">
          <motion.div className="splash__flare" initial={{ scale: 0, opacity: 1 }} animate={{ scale: 4, opacity: 0 }} transition={{ duration: 1.6, ease: "easeOut" }} />
          <motion.div
            initial={{ scale: 0.15, opacity: 0, rotate: -120 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 1.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <Logo size="min(56vmin, 460px)" />
          </motion.div>
          <div className="splash__title t-hi" aria-label="Kaun Banega Crorepati">
            {TITLE.map((w, i) => (
              <motion.span
                key={w}
                className="t-gold"
                initial={{ opacity: 0, y: 26, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 1.3 + i * 0.28, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                {w}
              </motion.span>
            ))}
          </div>
          <motion.p className="splash__tag" initial={{ opacity: 0, letterSpacing: "0.6em" }} animate={{ opacity: 1, letterSpacing: "0.32em" }} transition={{ delay: 2.4, duration: 1.4 }}>
            GYAAN KA MAHAMANCH
          </motion.p>
          <motion.div className="splash__skip" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 2.8 }}>
            Click to skip
          </motion.div>
        </div>
      )}
    </div>
  );
}
