import { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, Text, View } from 'react-native';
import { FieldError } from '../common/FieldError';
import { MpinDots, MPIN_LENGTH } from '../common/MpinDots';
import { NumericKeypad } from '../common/NumericKeypad';
import { useAuthSession } from '../../context/AuthSessionContext';
import { authApi } from '../../services/authApi';
import type { MPIN } from '../../types/api';
import { AuthSheetLayout } from '../layout/AuthSheetLayout';
import { RecoveryFlow, type RecoveryCopy } from './RecoveryFlow';

const copy: RecoveryCopy = {
  title: 'Reset MPIN',
  subtitle: 'Enter your registered email to verify your account and set a new MPIN.',
  sendLabel: 'Send Verification Code',
  rememberPrompt: 'Remember your MPIN?',
  exitLabel: 'Enter MPIN',
  verifyTitle: 'Verify your identity',
  codePrompt: 'Enter the 6-digit code sent to',
  changeEmailLabel: 'Not You?',
  successTitle: 'MPIN updated',
  successDescription: 'Your new 4-digit MPIN is active.\nUse it to confirm pickups and sign in faster.',
  doneLabel: 'Continue',
};

export function MpinRecoveryScreen({
  onExit,
  onDone,
}: {
  onExit: () => void;
  onDone?: () => void;
}) {
  return (
    <RecoveryFlow
      copy={copy}
      onExit={onExit}
      onDone={onDone}
      onRequestCode={(email) => authApi.forgotMpin({ email })}
      onVerifyCode={(email, code) => authApi.verifyMpinResetOtp({ email, code })}
      renderReset={(actions) => <MpinResetStep {...actions} onExit={onExit} />}
    />
  );
}

interface MpinResetStepProps {
  email: string;
  resetToken: string;
  onBack: () => void;
  onComplete: () => void;
  onExit: () => void;
}

function MpinResetStep({ email, resetToken, onBack, onComplete, onExit }: MpinResetStepProps) {
  const { resetCustomerMpin } = useAuthSession();
  const [newPin, setNewPin] = useState('');
  const [entry, setEntry] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isConfirming = newPin.length === MPIN_LENGTH;

  const resetEntry = () => {
    setNewPin('');
    setEntry('');
    setErrorMessage(null);
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isSubmitting) return true;
      if (isConfirming) resetEntry();
      else onBack();
      return true;
    });
    return () => subscription.remove();
  }, [isConfirming, isSubmitting, onBack]);

  const pressDigit = async (digit: string) => {
    if (isSubmitting) return;
    const next = entry + digit;
    setErrorMessage(null);

    if (next.length < MPIN_LENGTH) {
      setEntry(next);
      return;
    }

    setEntry('');
    if (!isConfirming) {
      setNewPin(next);
      return;
    }

    if (next !== newPin) {
      setErrorMessage('MPINs do not match. Try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetCustomerMpin({ resetToken, newMpin: next as MPIN });
      onComplete();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to reset MPIN. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const editEntry = (value: string) => {
    if (isSubmitting) return;
    setEntry(value);
    setErrorMessage(null);
  };

  return (
    <AuthSheetLayout onBack={isConfirming || isSubmitting ? undefined : onBack}>
      <View style={styles.content}>
        <View style={styles.account}>
          <Text style={styles.email}>{email}</Text>
          <Text style={styles.step}>STEP 3 OF 3</Text>
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          {isConfirming ? 'Confirm your 4-digit MPIN' : 'Create new 4-digit MPIN'}
        </Text>
        <Text style={styles.subtitle}>
          {isConfirming ? 'Re-enter your new MPIN to save changes' : 'Avoid sequential numbers like 1234'}
        </Text>
        <MpinDots filledCount={entry.length} style={styles.dots} />
        {isSubmitting && <ActivityIndicator color="#2563eb" size="small" style={styles.loader} />}
        {errorMessage && (
          <View style={styles.error}>
            <FieldError message={errorMessage} />
          </View>
        )}
        <NumericKeypad
          disabled={isSubmitting}
          onPressDigit={pressDigit}
          onPressBackspace={() => editEntry(entry.slice(0, -1))}
          onPressClear={() => editEntry('')}
          style={styles.keypad}
        />
        <Text
          accessibilityRole="button"
          style={styles.link}
          onPress={isSubmitting ? undefined : isConfirming ? resetEntry : onExit}
        >
          {isConfirming ? 'Re-enter new MPIN' : 'Cancel Reset'}
        </Text>
      </View>
    </AuthSheetLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 20 },
  account: {
    alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between',
    borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 12, padding: 14,
  },
  email: { flexShrink: 1, color: '#0f172a', fontFamily: 'GoogleSans-Bold', fontSize: 14 },
  step: { color: '#2563eb', fontFamily: 'GoogleSans-Bold', fontSize: 11 },
  title: { marginTop: 20, textAlign: 'center', color: '#0f172a', fontFamily: 'GoogleSans-Bold', fontSize: 20 },
  subtitle: { textAlign: 'center', color: '#64748b', fontFamily: 'GoogleSans-Regular', fontSize: 13 },
  dots: { marginVertical: 22 },
  loader: { marginBottom: 8 },
  error: { alignItems: 'center', paddingRight: 4 },
  keypad: { marginTop: 12 },
  link: { alignSelf: 'center', padding: 12, marginTop: 20, color: '#2563eb', fontFamily: 'GoogleSans-Bold' },
});
