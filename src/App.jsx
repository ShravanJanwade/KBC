import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { StageProvider } from "./components/Stage";
import { ToastProvider } from "./components/Toasts";
import { useApp } from "./state/AppContext";
import Splash from "./screens/Splash";
import Onboarding from "./screens/Onboarding";
import MainMenu from "./screens/MainMenu";
import Topics from "./screens/Topics";
import History from "./screens/History";
import Profile from "./screens/Profile";
import Settings from "./screens/Settings";
import HowToPlay from "./screens/HowToPlay";
import FastestFinger from "./screens/FastestFinger";
import HotSeat from "./screens/hotseat/HotSeat";
import Result from "./screens/Result";

export default function App() {
  const { profile, settings } = useApp();
  const [screen, setScreen] = useState({ name: "splash", params: {}, key: 0 });
  const go = useCallback((name, params = {}) => setScreen((s) => ({ name, params, key: s.key + 1 })), []);
  const reduced = settings.reducedMotion;

  // No active player (first run, or the last profile was deleted) → onboarding.
  useEffect(() => {
    if (!profile && screen.name !== "splash" && screen.name !== "onboarding") go("onboarding");
  }, [profile, screen.name, go]);

  const play = useCallback(() => go(settings.fff ? "fff" : "hotseat"), [go, settings.fff]);
  const toMenu = useCallback(() => go("menu"), [go]);

  const render = () => {
    const p = screen.params;
    switch (screen.name) {
      case "splash":
        return <Splash onDone={() => go(profile ? "menu" : "onboarding")} />;
      case "onboarding":
        return <Onboarding onDone={toMenu} onCancel={profile ? toMenu : null} />;
      case "menu":
        return <MainMenu go={go} onPlay={play} />;
      case "topics":
        return <Topics onBack={toMenu} />;
      case "history":
        return <History onBack={toMenu} onPlay={play} />;
      case "profile":
        return <Profile onBack={toMenu} onAddPlayer={() => go("onboarding")} />;
      case "settings":
        return <Settings onBack={toMenu} />;
      case "howto":
        return <HowToPlay onBack={toMenu} onPlay={play} />;
      case "fff":
        return <FastestFinger onWin={(fff) => go("hotseat", { fff })} onExit={toMenu} />;
      case "hotseat":
        return <HotSeat fff={p.fff} onFinish={(game, unlocked) => go("result", { game, unlocked })} />;
      case "result":
        return <Result game={p.game} unlocked={p.unlocked} onPlayAgain={play} onMenu={toMenu} onHistory={() => go("history")} />;
      default:
        return null;
    }
  };

  return (
    <MotionConfig reducedMotion={reduced ? "always" : "user"}>
      <StageProvider>
        <ToastProvider>
          <div className={`app${reduced ? " reduce-motion" : ""}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={screen.key}
                className="screen"
                initial={{ opacity: 0, scale: 1.015 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {render()}
              </motion.div>
            </AnimatePresence>
          </div>
        </ToastProvider>
      </StageProvider>
    </MotionConfig>
  );
}
