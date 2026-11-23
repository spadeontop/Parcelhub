import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

interface UseClaimCountdownParams {
  readonly isClaimActive?: boolean;
  readonly claimExpiresAt?: string | null;
  readonly claimRemainingSeconds?: number;
}

interface UseClaimCountdownResult {
  readonly remainingSecs: number;
  readonly timeFormatted: string;
  readonly startLocalWindow: (durationSeconds: number) => void;
  readonly resetCountdown: () => void;
}

const CLOCK_JITTER_TOLERANCE_MS = 3000;

function computeRemainingFromDeadline(deadlineMs: number | null): number {
  if (deadlineMs === null) return 0;
  return Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
}

/**
 * Tracks the pickup pass countdown against a wall-clock deadline timestamp
 * and immediately recalculates on AppState 'active' resume so backgrounding
 * the app never freezes the timer.
 */
export function useClaimCountdown({
  isClaimActive,
  claimExpiresAt,
  claimRemainingSeconds,
}: UseClaimCountdownParams): UseClaimCountdownResult {
  const deadlineRef = useRef<number | null>(null);
  const [remainingSecs, setRemainingSecs] = useState<number>(0);

  const syncFromDeadline = useCallback(() => {
    setRemainingSecs(computeRemainingFromDeadline(deadlineRef.current));
  }, []);

  // Reconcile server-provided claim window into a stable local deadline timestamp
  useEffect(() => {
    if (!isClaimActive) {
      if (deadlineRef.current !== null) {
        deadlineRef.current = null;
        setRemainingSecs(0);
      }
      return;
    }

    let nextDeadline: number | null = null;
    if (typeof claimRemainingSeconds === 'number' && claimRemainingSeconds > 0) {
      nextDeadline = Date.now() + claimRemainingSeconds * 1000;
    } else if (claimExpiresAt) {
      const parsed = Date.parse(claimExpiresAt);
      if (Number.isFinite(parsed)) {
        nextDeadline = parsed;
      }
    }

    if (nextDeadline === null) {
      deadlineRef.current = null;
      setRemainingSecs(0);
      return;
    }

    const currentDeadline = deadlineRef.current;
    if (
      currentDeadline === null ||
      Math.abs(nextDeadline - currentDeadline) > CLOCK_JITTER_TOLERANCE_MS
    ) {
      deadlineRef.current = nextDeadline;
      setRemainingSecs(computeRemainingFromDeadline(nextDeadline));
    }
  }, [isClaimActive, claimExpiresAt, claimRemainingSeconds]);

  // 1-second tick derived from deadline timestamp
  useEffect(() => {
    if (remainingSecs <= 0) return;
    const timer = setInterval(syncFromDeadline, 1000);
    return () => clearInterval(timer);
  }, [remainingSecs > 0, syncFromDeadline]);

  // Recalculate immediately when returning from background
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        syncFromDeadline();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [syncFromDeadline]);

  const startLocalWindow = useCallback((durationSeconds: number) => {
    const safeSeconds = Math.max(0, durationSeconds);
    const nextDeadline = Date.now() + safeSeconds * 1000;
    deadlineRef.current = nextDeadline;
    setRemainingSecs(safeSeconds);
  }, []);

  const resetCountdown = useCallback(() => {
    deadlineRef.current = null;
    setRemainingSecs(0);
  }, []);

  const mm = Math.floor(remainingSecs / 60);
  const ss = remainingSecs % 60;
  const timeFormatted = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;

  return {
    remainingSecs,
    timeFormatted,
    startLocalWindow,
    resetCountdown,
  };
}
