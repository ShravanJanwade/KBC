import { useCallback, useEffect, useRef } from "react";

const CANCELLED = Symbol("cancelled");

// Runs one async, timed sequence at a time. Starting a new sequence (or unmounting) cancels the
// previous one: its next `await wait(ms)` rejects silently, so stale steps never fire.
export function useSequencer() {
  const token = useRef(0);
  useEffect(() => () => void token.current++, []);

  const run = useCallback((fn) => {
    const mine = ++token.current;
    const wait = (ms) =>
      new Promise((resolve, reject) => {
        setTimeout(() => (mine === token.current ? resolve() : reject(CANCELLED)), ms);
      });
    const alive = () => mine === token.current;
    Promise.resolve()
      .then(() => fn(wait, alive))
      .catch((e) => {
        if (e !== CANCELLED) console.error(e);
      });
  }, []);

  const cancel = useCallback(() => void token.current++, []);
  return { run, cancel };
}
