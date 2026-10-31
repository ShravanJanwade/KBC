import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NamedIcon } from "./icons";
import { sfx } from "../audio/synth";

const ToastCtx = createContext({ push: () => {} });

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    setItems((list) => [...list, { id, ...toast }]);
    sfx.ding();
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), toast.duration ?? 4800);
  }, []);

  const api = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toasts" aria-live="polite">
        <AnimatePresence>
          {items.map((t, i) => (
            <motion.div
              key={t.id}
              className="toast glass glass--gold"
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1, transition: { delay: i * 0.12, type: "spring", stiffness: 300, damping: 24 } }}
              exit={{ opacity: 0, x: 60, transition: { duration: 0.25 } }}
            >
              <div className="toast__icon">
                <NamedIcon name={t.icon} size={22} />
              </div>
              <div>
                <div className="toast__eyebrow">{t.eyebrow ?? "Achievement unlocked"}</div>
                <div className="toast__title">{t.title}</div>
                {t.desc && <div className="toast__desc">{t.desc}</div>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export const useToasts = () => useContext(ToastCtx);
