import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, animate, motion } from "framer-motion";
import { X, ArrowLeft } from "lucide-react";
import { sfx } from "../audio/synth";
import { formatINR } from "../lib/format";

export function Button({ variant = "gold", size = "md", icon: Icon, iconRight: IconRight, children, className = "", quiet = false, onClick, ...rest }) {
  const iconSize = size === "lg" ? 22 : size === "sm" ? 16 : 18;
  return (
    <button
      type="button"
      className={`btn btn--${variant} btn--${size} ${!children ? "btn--icon" : ""} ${className}`}
      onMouseEnter={quiet ? undefined : () => sfx.hover()}
      onClick={(e) => {
        if (!quiet) sfx.click();
        onClick?.(e);
      }}
      {...rest}
    >
      {Icon && <Icon size={iconSize} strokeWidth={2.2} />}
      {children && <span>{children}</span>}
      {IconRight && <IconRight size={iconSize} strokeWidth={2.2} />}
    </button>
  );
}

export function BackButton({ onClick, label = "Back" }) {
  return (
    <Button variant="glass" size="sm" icon={ArrowLeft} className="back-btn" aria-label={label} onClick={onClick}>
      {label}
    </Button>
  );
}

export function Modal({ open, onClose, children, size = "md", className = "", dismissible = true, label }) {
  useEffect(() => {
    if (!open || !dismissible) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, dismissible, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onMouseDown={(e) => {
            if (dismissible && e.target === e.currentTarget) onClose?.();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className={`modal__panel modal__panel--${size} ${className}`}
            initial={{ opacity: 0, y: 34, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          >
            {dismissible && onClose && (
              <Button variant="ghost" size="sm" icon={X} className="close-x" aria-label="Close" onClick={onClose} quiet />
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="toggle"
      onClick={() => {
        sfx.click();
        onChange(!checked);
      }}
    />
  );
}

export function Segmented({ value, options, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="seg__btn"
          aria-pressed={value === o.value}
          title={o.title}
          onClick={() => {
            sfx.click();
            onChange(o.value);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Range({ value, onChange, min = 0, max = 1, step = 0.05, label, onCommit }) {
  const p = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      className="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      style={{ "--p": `${p}%` }}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      onPointerUp={onCommit}
      onKeyUp={onCommit}
    />
  );
}

// Counts up to `value` whenever it changes.
export function AnimatedMoney({ value, duration = 1.1, format = formatINR, className }) {
  const ref = useRef(null);
  const from = useRef(0);
  useEffect(() => {
    const controls = animate(from.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = format(v);
      },
    });
    from.current = value;
    return () => controls.stop();
  }, [value, duration, format]);
  return (
    <span ref={ref} className={className}>
      {format(from.current)}
    </span>
  );
}

export function ProgressBar({ value, color }) {
  return (
    <div className="bar">
      <span style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, background: color }} />
    </div>
  );
}
