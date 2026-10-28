/// <reference types="vite/client" />

const getEnvNumber = (key: string, defaultValue: number): number => {
  let raw: any;
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    raw = import.meta.env[key] || import.meta.env[`VITE_${key}`];
  }
  if (raw === undefined && typeof globalThis !== 'undefined') {
    const proc = (globalThis as any).process;
    if (proc && proc.env) {
      raw = proc.env[key] || proc.env[`VITE_${key}`];
    }
  }
  const parsed = Number(raw);
  return !isNaN(parsed) && parsed > 0 ? parsed : defaultValue;
};

// Global configuration read from environment variables or defaults
export const ENV = {
  HANDOFF_CUTOFF_TIME_MINS: getEnvNumber('HANDOFF_CUTOFF_TIME_MINS', 5),
};
