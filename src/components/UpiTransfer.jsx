import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, Wifi, BatteryFull, Bell, ArrowRight } from "lucide-react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { AnimatedMoney } from "./ui";
import { sfx } from "../audio/synth";
import { formatINR } from "../lib/format";

const STEPS = { connecting: 900, sending: 2300 };

const handleFor = (name) => `${name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 14) || "player"}@gyaanpay`;
const refNo = () => Array.from({ length: 12 }, (_, i) => (i === 0 ? 3 + Math.floor(Math.random() * 6) : Math.floor(Math.random() * 10))).join("");

// The prize lands in the player's account: a tablet running a UPI app from the game's own
// (fictional) bank, from "connecting" to "sending" to the payment-successful screen.
export default function UpiTransfer({ name, avatar, amount, date = Date.now(), delay = 600, onSuccess }) {
  const [stage, setStage] = useState("idle");
  const ref = useMemo(refNo, []);
  const when = useMemo(() => new Date(date), [date]);
  const clock = when.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: false });

  useEffect(() => {
    const t0 = setTimeout(() => setStage("connecting"), delay);
    const t1 = setTimeout(() => {
      setStage("sending");
      sfx.whoosh("up", 0.6);
    }, delay + STEPS.connecting);
    const t2 = setTimeout(() => {
      setStage("success");
      sfx.upiSuccess();
      onSuccess?.();
    }, delay + STEPS.connecting + STEPS.sending);
    const t3 = setTimeout(() => sfx.notify(), delay + STEPS.connecting + STEPS.sending + 1100);
    return () => [t0, t1, t2, t3].forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="upi"
      initial={{ opacity: 0, y: 70, rotateX: 28 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: delay / 2000, type: "spring", stiffness: 110, damping: 17 }}
      role="img"
      aria-label={`Payment of ${formatINR(amount)} to ${name}`}
    >
      <div className="upi__tablet">
        <span className="upi__camera" aria-hidden="true" />
        <div className="upi__screen">
          <div className="upi__statusbar">
            <span className="t-num">{clock}</span>
            <span>Bharat Gyaan Bank</span>
            <span className="upi__icons">
              <Wifi size={12} />
              <BatteryFull size={15} />
            </span>
          </div>

          <AnimatePresence>
            {stage === "success" && (
              <motion.div className="upi__notif" initial={{ y: -70, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -70, opacity: 0 }} transition={{ delay: 1.1, type: "spring", stiffness: 260, damping: 22 }}>
                <span className="upi__notif-icon">
                  <Bell size={14} />
                </span>
                <span>
                  <b>Bharat Gyaan Bank</b> · now
                  <br />
                  A/c XX2016 credited with {formatINR(amount)} via UPI from KBC Prize Pool. Ref {ref}.
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="upi__app">
            <header className="upi__head">
              <span className="upi__brand">
                Gyaan<b>Pay</b>
              </span>
              <span className="upi__badge">UPI</span>
            </header>

            <AnimatePresence mode="wait">
              {stage !== "success" ? (
                <motion.div key="sending" className="upi__sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
                  <div className="upi__parties">
                    <span className="upi__party">
                      <Logo size={56} spin={false} shine={false} />
                      <small>KBC Prize Pool</small>
                    </span>
                    <span className={`upi__flow${stage === "sending" ? " is-on" : ""}`} aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <ArrowRight size={18} />
                    </span>
                    <span className="upi__party">
                      <Avatar config={avatar} size={56} />
                      <small>{name}</small>
                    </span>
                  </div>
                  <div className="upi__label">{stage === "sending" ? `Sending money to ${name}` : "Connecting to your bank…"}</div>
                  <div className="upi__amount t-num">{formatINR(amount)}</div>
                  <div className="upi__progress">
                    <span className={stage === "sending" ? "is-on" : ""} />
                  </div>
                  <div className="upi__secure">
                    <ShieldCheck size={14} /> UPI PIN verified · Secure transfer
                  </div>
                </motion.div>
              ) : (
                <motion.div key="done" className="upi__success" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}>
                  <svg viewBox="0 0 80 80" className="upi__check" aria-hidden="true">
                    <motion.circle cx="40" cy="40" r="34" fill="#1fbf68" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }} style={{ transformOrigin: "40px 40px" }} />
                    <motion.path d="M24 41 L35 52 L57 29" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.45 }} />
                  </svg>
                  <div className="upi__ok">Payment successful</div>
                  <AnimatedMoney value={amount} duration={1.6} className="upi__amount upi__amount--done t-num" />
                  <div className="upi__to">
                    Paid to <b>{name}</b>
                    <br />
                    {handleFor(name)}
                  </div>
                  <dl className="upi__details">
                    <div>
                      <dt>From</dt>
                      <dd>KBC Prize Pool</dd>
                    </div>
                    <div>
                      <dt>UPI Ref No.</dt>
                      <dd className="t-num">{ref}</dd>
                    </div>
                    <div>
                      <dt>Date</dt>
                      <dd>
                        {when.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}, {clock}
                      </dd>
                    </div>
                  </dl>
                  <div className="upi__foot">Game prize from Kaun Banega Crorepati · not a real bank transaction</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
