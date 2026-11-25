import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface UseDeadlineCountdownOptions {
  isActive: boolean;
  initialSeconds?: number;
  fallbackActiveSeconds?: number;
}

/**
 * Wall-clock countdown hook that avoids 1s interval churn and stays accurate
 * across background/foreground transitions via AppState.
 */
export function useDeadlineCountdown({
  isActive,
  initialSeconds,
  fallbackActiveSeconds = 0,
}: UseDeadlineCountdownOptions): number {
  const seedSeconds = isActive
    ? Math.max(0, initialSeconds ?? fallbackActiveSeconds)
    : 0;

  const deadlineMsRef = useRef<number>(
    seedSeconds > 0 ? Date.now() + seedSeconds * 1000 : 0
  );
  const [remainingSeconds, setRemainingSeconds] = useState<number>(seedSeconds);

  useEffect(() => {
    const nextSeed = isActive
      ? Math.max(0, initialSeconds ?? fallbackActiveSeconds)
      : 0;

    if (nextSeed <= 0) {
      deadlineMsRef.current = 0;
      setRemainingSeconds(0);
      return;
    }

    deadlineMsRef.current = Date.now() + nextSeed * 1000;
    setRemainingSeconds(nextSeed);

    const syncRemaining = () => {
      const diffMs = deadlineMsRef.current - Date.now();
      const next = diffMs > 0 ? Math.ceil(diffMs / 1000) : 0;
      setRemainingSeconds((prev) => (prev === next ? prev : next));
      return next;
    };

    const interval = setInterval(() => {
      if (syncRemaining() <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          syncRemaining();
        }
      }
    );

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [isActive, initialSeconds, fallbackActiveSeconds]);

  return remainingSeconds;
}
