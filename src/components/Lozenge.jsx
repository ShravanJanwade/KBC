import { forwardRef } from "react";

// The show's signature elongated hexagon with a metallic rim. `state` drives colour:
// idle | selected | locked | correct | wrong | dim | removed | gold
const Lozenge = forwardRef(function Lozenge({ as: Tag = "div", size = "opt", state = "idle", interactive = false, className = "", children, ...rest }, ref) {
  return (
    <Tag ref={ref} className={`lz lz--${size}${interactive ? " lz--interactive" : ""} ${className}`} data-state={state} {...rest}>
      <span className="lz__shape" aria-hidden="true" />
      <span className="lz__fill" aria-hidden="true" />
      <span className="lz__content">{children}</span>
    </Tag>
  );
});

export default Lozenge;
