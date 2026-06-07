import { useEffect, useRef, useState } from "react";

export const MIN_LOADING_TIME = 250;
export const MAX_LOADING_TIME = 5000;

export function useMinLoadingGate(isWaiting: boolean) {
  const [minReady, setMinReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const startRef = useRef<number | undefined>(undefined);
  const minTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const maxTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (isWaiting) {
      if (startRef.current === undefined) {
        startRef.current = Date.now();
        setMinReady(false);
        setTimedOut(false);
        if (minTimeoutRef.current) clearTimeout(minTimeoutRef.current);
        if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
        maxTimeoutRef.current = setTimeout(() => {
          setTimedOut(true);
          startRef.current = undefined;
        }, MAX_LOADING_TIME);
      }
      return;
    }

    if (startRef.current !== undefined) {
      const elapsed = Date.now() - startRef.current;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
        maxTimeoutRef.current = undefined;
      }
      if (remainingTime > 0) {
        if (minTimeoutRef.current) clearTimeout(minTimeoutRef.current);
        minTimeoutRef.current = setTimeout(() => {
          setMinReady(true);
          startRef.current = undefined;
          minTimeoutRef.current = undefined;
        }, remainingTime);
      } else {
        setMinReady(true);
        startRef.current = undefined;
      }
    } else {
      setMinReady(true);
    }

    return () => {
      if (minTimeoutRef.current) clearTimeout(minTimeoutRef.current);
      if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
    };
  }, [isWaiting]);

  return { minReady, timedOut };
}
