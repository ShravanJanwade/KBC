import { Dices } from "lucide-react";
import Avatar from "./Avatar";
import { BACKGROUNDS, BEARDS, HAIR_COLORS, HAIR_STYLES, OUTFITS, OUTFIT_COLORS, SKIN, randomAvatar } from "./avatarParts";
import { Button, Segmented } from "./ui";
import { sfx } from "../audio/synth";

const LABELS = { short: "Short", side: "Side part", spiky: "Spiky", curly: "Curly", long: "Long", bob: "Bob", bun: "Bun", ponytail: "Ponytail", bald: "Bald", turban: "Turban" };
const OUTFIT_LABELS = { kurta: "Kurta", blazer: "Blazer", tee: "T-shirt", saree: "Saree", hoodie: "Hoodie" };
const BEARD_LABELS = { none: "None", stubble: "Stubble", mustache: "Moustache", full: "Beard" };

export default function AvatarBuilder({ value, onChange }) {
  const set = (patch) => {
    sfx.click();
    onChange({ ...value, ...patch });
  };

  return (
    <div className="ab">
      <div className="ab__preview">
        <Avatar config={value} size={168} ring />
        <Button variant="glass" size="sm" icon={Dices} onClick={() => onChange(randomAvatar())}>
          Surprise me
        </Button>
      </div>
      <div className="ab__controls scroll">
        <Row label="Skin tone">
          {SKIN.map((c, i) => (
            <Swatch key={c} color={c} active={value.skin === i} onClick={() => set({ skin: i })} label={`Skin tone ${i + 1}`} />
          ))}
        </Row>
        <Row label="Hair">
          {HAIR_STYLES.map((h) => (
            <button key={h} type="button" className={`ab__thumb${value.hair === h ? " is-active" : ""}`} onClick={() => set({ hair: h })} title={LABELS[h]} aria-label={LABELS[h]}>
              <Avatar config={{ ...value, hair: h }} size={46} />
            </button>
          ))}
        </Row>
        <Row label="Hair colour">
          {HAIR_COLORS.map((c, i) => (
            <Swatch key={c} color={c} active={value.hairColor === i} onClick={() => set({ hairColor: i })} label={`Hair colour ${i + 1}`} />
          ))}
        </Row>
        <Row label="Outfit">
          {OUTFITS.map((o) => (
            <button key={o} type="button" className={`ab__thumb${value.outfit === o ? " is-active" : ""}`} onClick={() => set({ outfit: o })} title={OUTFIT_LABELS[o]} aria-label={OUTFIT_LABELS[o]}>
              <Avatar config={{ ...value, outfit: o }} size={46} />
            </button>
          ))}
        </Row>
        <Row label="Outfit colour">
          {OUTFIT_COLORS.map((c, i) => (
            <Swatch key={c} color={c} active={value.outfitColor === i} onClick={() => set({ outfitColor: i })} label={`Outfit colour ${i + 1}`} />
          ))}
        </Row>
        <Row label="Backdrop">
          {BACKGROUNDS.map(([a, b], i) => (
            <Swatch key={a} color={`linear-gradient(135deg, ${a}, ${b})`} active={value.bg === i} onClick={() => set({ bg: i })} label={`Backdrop ${i + 1}`} />
          ))}
        </Row>
        <Row label="Facial hair">
          <Segmented value={value.beard ?? "none"} onChange={(beard) => onChange({ ...value, beard })} options={BEARDS.map((b) => ({ value: b, label: BEARD_LABELS[b] }))} label="Facial hair" />
        </Row>
        <Row label="Extras">
          {[
            ["glasses", "Glasses"],
            ["bindi", "Bindi"],
            ["earrings", "Earrings"],
          ].map(([k, label]) => (
            <button key={k} type="button" className={`chip ab__extra${value[k] ? " chip--gold" : ""}`} aria-pressed={!!value[k]} onClick={() => set({ [k]: !value[k] })}>
              {label}
            </button>
          ))}
        </Row>
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="ab__row">
      <div className="ab__label">{label}</div>
      <div className="ab__opts">{children}</div>
    </div>
  );
}

function Swatch({ color, active, onClick, label }) {
  return <button type="button" className={`ab__swatch${active ? " is-active" : ""}`} style={{ background: color }} onClick={onClick} aria-label={label} aria-pressed={active} />;
}
