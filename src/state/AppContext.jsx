import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { load, save, remove } from "../lib/storage";
import { uid } from "../lib/random";
import { audio } from "../audio/engine";
import { newRating } from "../engine/rating";

const DEFAULT_SETTINGS = {
  master: 0.9,
  music: 0.6,
  sfx: 0.9,
  muted: false,
  hostVoice: false,
  lifelineVoice: true,
  timerMode: "classic", // classic | relaxed | off
  confirmLock: true,
  fff: true,
  difficulty: "adaptive", // adaptive | classic | easy | hard
  language: "hinglish", // hinglish | english
  reducedMotion: false,
};

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...load("settings", {}) }));
  const [profiles, setProfiles] = useState(() => load("profiles", []));
  const [activeId, setActiveId] = useState(() => {
    const id = load("active", null);
    return load("profiles", []).some((p) => p.id === id) ? id : null;
  });
  const [history, setHistory] = useState(() => (activeId ? load(`history.${activeId}`, []) : []));
  const [seen, setSeen] = useState(() => (activeId ? load(`seen.${activeId}`, {}) : {}));

  const profile = useMemo(() => profiles.find((p) => p.id === activeId) ?? null, [profiles, activeId]);

  useEffect(() => save("settings", settings), [settings]);
  useEffect(() => save("profiles", profiles), [profiles]);
  useEffect(() => save("active", activeId), [activeId]);
  useEffect(() => {
    if (activeId) save(`history.${activeId}`, history);
  }, [history, activeId]);
  useEffect(() => {
    if (activeId) save(`seen.${activeId}`, seen);
  }, [seen, activeId]);
  useEffect(() => {
    audio.setVolumes({ master: settings.muted ? 0 : settings.master, music: settings.music, sfx: settings.sfx });
  }, [settings.master, settings.music, settings.sfx, settings.muted]);

  const switchProfile = useCallback((id) => {
    setActiveId(id);
    setHistory(id ? load(`history.${id}`, []) : []);
    setSeen(id ? load(`seen.${id}`, {}) : {});
  }, []);

  const createProfile = useCallback(
    ({ name, city, avatar, level, favourites = [] }) => {
      const relevance = {};
      favourites.forEach((c) => (relevance[c] = 3));
      const p = {
        id: uid(),
        createdAt: Date.now(),
        name: name.trim(),
        city: city?.trim() || "",
        avatar,
        level,
        rating: newRating(level),
        relevance,
        favourites,
        achievements: {},
      };
      setProfiles((list) => [...list, p]);
      switchProfile(p.id);
      return p;
    },
    [switchProfile]
  );

  const updateProfile = useCallback(
    (patch) => {
      setProfiles((list) => list.map((p) => (p.id === activeId ? { ...p, ...(typeof patch === "function" ? patch(p) : patch) } : p)));
    },
    [activeId]
  );

  const deleteProfile = useCallback(
    (id) => {
      remove(`history.${id}`);
      remove(`seen.${id}`);
      const next = profiles.filter((p) => p.id !== id);
      setProfiles(next);
      if (id === activeId) switchProfile(next[0]?.id ?? null);
    },
    [profiles, activeId, switchProfile]
  );

  const markSeen = useCallback((ids) => {
    const t = Date.now();
    setSeen((prev) => {
      const next = { ...prev };
      ids.forEach((id) => (next[id] = t));
      return next;
    });
  }, []);

  const resetSeen = useCallback(() => setSeen({}), []);
  const recordGame = useCallback((game) => setHistory((prev) => [game, ...prev].slice(0, 300)), []);
  const clearHistory = useCallback(() => setHistory([]), []);
  const updateSettings = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);

  const resetEverything = useCallback(() => {
    profiles.forEach((p) => {
      remove(`history.${p.id}`);
      remove(`seen.${p.id}`);
    });
    setProfiles([]);
    switchProfile(null);
    setSettings(DEFAULT_SETTINGS);
  }, [profiles, switchProfile]);

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      profiles,
      profile,
      createProfile,
      updateProfile,
      deleteProfile,
      switchProfile,
      history,
      recordGame,
      clearHistory,
      seen,
      markSeen,
      resetSeen,
      resetEverything,
    }),
    [settings, updateSettings, profiles, profile, createProfile, updateProfile, deleteProfile, switchProfile, history, recordGame, clearHistory, seen, markSeen, resetSeen, resetEverything]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const useApp = () => useContext(AppCtx);
