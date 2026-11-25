import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import type { ButtonActionState } from '../components/common/StaffActionButton';

export function useActionSubmit() {
  const [isLocked, setIsLocked] = useState(false);
  const [btnState, setBtnState] = useState<ButtonActionState>('idle');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [shakeTrigger, setShakeTrigger] = useState(0);

  const triggerValidationError = useCallback((message: string) => {
    setHasError(true);
    setErrorMessage(message);
    setShakeTrigger((c) => c + 1);
  }, []);

  const clearError = useCallback(() => {
    setHasError(false);
    setErrorMessage('');
  }, []);

  const reset = useCallback(() => {
    setIsLocked(false);
    setBtnState('idle');
    setHasError(false);
    setErrorMessage('');
  }, []);

  const runSubmit = useCallback(
    async (
      task: () => Promise<void>,
      errorTitle: string,
      fallbackErrorMessage: string
    ): Promise<boolean> => {
      setHasError(false);
      setErrorMessage('');
      setIsLocked(true);
      setBtnState('loading');
      try {
        await task();
        return true;
      } catch (err: any) {
        setIsLocked(false);
        setBtnState('idle');
        Alert.alert(errorTitle, err?.message || fallbackErrorMessage);
        return false;
      }
    },
    []
  );

  return {
    isLocked,
    btnState,
    hasError,
    errorMessage,
    shakeTrigger,
    triggerValidationError,
    clearError,
    reset,
    runSubmit,
  };
}
