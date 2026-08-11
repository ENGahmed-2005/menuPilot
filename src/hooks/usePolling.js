import { useEffect, useRef } from "react";

/**
 * Repeatedly invokes `callback` every `interval` ms.
 * Polling pauses while the tab is hidden and resumes (with an immediate run)
 * when it becomes visible again — this backs the near-real-time behaviour
 * required for the kitchen board and customer order tracking (FR-18, FR-20).
 */
export function usePolling(callback, interval, enabled = true) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !interval) return undefined;

    let timer = null;

    const tick = () => {
      if (!document.hidden) callbackRef.current();
    };

    const start = () => {
      stop();
      timer = setInterval(tick, interval);
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        callbackRef.current();
        start();
      }
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [interval, enabled]);
}
