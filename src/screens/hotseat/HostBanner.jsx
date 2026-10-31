import { AnimatePresence, motion } from "framer-motion";
import { Mic } from "lucide-react";
import { lineText } from "../../data/host";

// TV-style lower third for the host's lines.
export default function HostBanner({ line, language }) {
  return (
    <div className="host-banner" aria-live="polite">
      <AnimatePresence mode="wait">
        {line && (
          <motion.div
            key={line.key}
            className="host-banner__inner"
            initial={{ opacity: 0, y: 14, clipPath: "inset(0 48% 0 48% round 999px)" }}
            animate={{ opacity: 1, y: 0, clipPath: "inset(0 0% 0 0% round 999px)" }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="host-banner__tag">
              <Mic size={13} strokeWidth={2.5} /> HOST
            </span>
            <span className="host-banner__text">{lineText(line, language)}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
