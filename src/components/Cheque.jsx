import { motion } from "framer-motion";
import Logo from "./Logo";
import { inrWords } from "../lib/format";

const inr = new Intl.NumberFormat("en-IN");

// The giant KBC prize cheque.
export default function Cheque({ name, amount, date = Date.now(), delay = 0.5 }) {
  const d = new Date(date);
  const digits = [String(d.getDate()).padStart(2, "0"), String(d.getMonth() + 1).padStart(2, "0"), String(d.getFullYear())].join("").split("");

  return (
    <motion.div
      className="cheque"
      initial={{ opacity: 0, y: 70, rotateX: 55 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay, type: "spring", stiffness: 110, damping: 16 }}
      role="img"
      aria-label={`Cheque for ${inrWords(amount)} rupees payable to ${name}`}
    >
      <div className="cheque__guilloche" aria-hidden="true" />
      <div className="cheque__top">
        <div className="cheque__bank">
          <Logo size={44} spin={false} shine={false} />
          <div>
            <div className="cheque__bank-name">Bharat Gyaan Bank</div>
            <div className="cheque__branch">Kaun Banega Crorepati · Studio Branch, Mumbai</div>
          </div>
        </div>
        <div className="cheque__date">
          <span>Date</span>
          <span className="cheque__boxes">
            {digits.map((c, i) => (
              <b key={i}>{c}</b>
            ))}
          </span>
        </div>
      </div>

      <div className="cheque__line">
        <span className="cheque__label">Pay</span>
        <span className="cheque__value cheque__payee">{name}</span>
        <span className="cheque__label">or Bearer</span>
      </div>
      <div className="cheque__line">
        <span className="cheque__label">Rupees</span>
        <span className="cheque__value">{inrWords(amount)} Only</span>
      </div>

      <div className="cheque__row">
        <div className="cheque__acct">
          A/c No. 0016 0700 2016
          <br />
          KBC Prize Fund
        </div>
        <div className="cheque__amount">
          <span>₹</span>
          <b className="t-num">{inr.format(amount)}/-</b>
        </div>
      </div>

      <div className="cheque__sign">
        <svg viewBox="0 0 160 44" aria-hidden="true">
          <path d="M6 32 C14 8 24 6 21 27 S30 40 38 21 S52 6 57 26 S70 36 80 16 S96 9 103 29 S118 33 130 15 S146 12 154 22" fill="none" stroke="#1b2a6b" strokeWidth="2" strokeLinecap="round" />
          <path d="M30 38 C60 34 100 35 140 31" fill="none" stroke="#1b2a6b" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span>Authorised Signatory</span>
      </div>
      <div className="cheque__micr">⑈001600⑈ 400002016⑆ 070000⑈ 31</div>

      <motion.div className="cheque__stamp" initial={{ scale: 3, opacity: 0, rotate: -40 }} animate={{ scale: 1, opacity: 1, rotate: -14 }} transition={{ delay: delay + 1.1, type: "spring", stiffness: 260, damping: 14 }}>
        PAID
      </motion.div>
    </motion.div>
  );
}
