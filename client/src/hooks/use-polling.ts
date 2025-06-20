import { useEffect, useRef } from 'react';

export function usePolling(callback: () => void, interval: number, enabled = true) {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    function tick() {
      savedCallback.current?.();
    }

    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval, enabled]);
}
