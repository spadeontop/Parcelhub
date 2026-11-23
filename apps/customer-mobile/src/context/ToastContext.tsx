import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';

export type ToastState = {
  readonly show: boolean;
  readonly message: string;
};

type ToastActionsContextType = {
  readonly showToast: (message: string) => void;
};

const ToastStateContext = createContext<ToastState | undefined>(undefined);
const ToastActionsContext = createContext<ToastActionsContextType | undefined>(undefined);

/**
 * Provides global toast state and a stable `showToast` trigger.
 * Splitting state from actions ensures screens calling `showToast` do not re-render when a toast opens or closes.
 */
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ show: true, message });
    toastTimerRef.current = setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3200);
  }, []);

  const actionsValue = useMemo<ToastActionsContextType>(() => ({ showToast }), [showToast]);

  return (
    <ToastActionsContext.Provider value={actionsValue}>
      <ToastStateContext.Provider value={toast}>{children}</ToastStateContext.Provider>
    </ToastActionsContext.Provider>
  );
};

export const useToast = (): ToastActionsContextType => {
  const context = useContext(ToastActionsContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const useToastState = (): ToastState => {
  const context = useContext(ToastStateContext);
  if (!context) {
    throw new Error('useToastState must be used within a ToastProvider');
  }
  return context;
};
