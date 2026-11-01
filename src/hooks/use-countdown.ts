import { useCallback, useEffect, useState } from 'react';

// Seconds left since the last start(); ticks only while there's time left to show
export const useCountdown = () => {
  const [remaining, setRemaining] = useState(0);
  const running = remaining > 0;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setRemaining((seconds) => Math.max(seconds - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [running]);

  return { remaining, start: useCallback((seconds: number) => setRemaining(seconds), []) };
};
