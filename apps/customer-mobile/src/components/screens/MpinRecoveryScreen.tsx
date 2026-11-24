import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { FieldError } from '../common/FieldError';
import { NumericKeypad } from '../common/NumericKeypad';
import { PasswordRecoveryLayout } from '../layout/PasswordRecoveryLayout';
import { RecoveryFlow, type RecoveryCopy } from './RecoveryFlow';

const PIN_LENGTH = 4;

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
  doneLabel: 'Back to Enter MPIN',
};

export function MpinRecoveryScreen({ onExit }: { onExit: () => void }) {
  return (
    <RecoveryFlow
      copy={copy}
      onExit={onExit}
      renderReset={(actions) => <MpinResetStep {...actions} onExit={onExit} />}
    />
  );
}

interface MpinResetStepProps {
  email: string;
  onBack: () => void;
  onComplete: () => void;
  onExit: () => void;
}

function MpinResetStep({ email, onBack, onComplete, onExit }: MpinResetStepProps) {
  const [newPin, setNewPin] = useState('');
  const [entry, setEntry] = useState('');
  const [hasMismatch, setHasMismatch] = useState(false);
  const isConfirming = newPin.length === PIN_LENGTH;

  const resetEntry = () => {
    setNewPin('');
    setEntry('');
    setHasMismatch(false);
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isConfirming) resetEntry();
      else onBack();
      return true;
    });
    return () => subscription.remove();
  }, [isConfirming, onBack]);

  const pressDigit = (digit: string) => {
    const next = entry + digit;
    setHasMismatch(false);

    if (next.length < PIN_LENGTH) {
      setEntry(next);
      return;
    }

    setEntry('');
    if (!isConfirming) {
      setNewPin(next);
    } else if (next === newPin) {
      onComplete();
    } else {
      setHasMismatch(true);
    }
  };

  const editEntry = (value: string) => {
    setEntry(value);
    setHasMismatch(false);
  };

  return (
    <PasswordRecoveryLayout onBack={isConfirming ? undefined : onBack}>
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
        <View accessible accessibilityLabel={entry.length + ' of 4 digits entered'} style={styles.dots}>
          {Array.from({ length: PIN_LENGTH }, (_, index) => (
            <View key={index} style={[styles.dot, index < entry.length && styles.filledDot]} />
          ))}
        </View>
        {hasMismatch && (
          <View style={styles.error}>
            <FieldError message="MPINs do not match. Try again." />
          </View>
        )}
        <NumericKeypad
          onPressDigit={pressDigit}
          onPressBackspace={() => editEntry(entry.slice(0, -1))}
          onPressClear={() => editEntry('')}
          style={styles.keypad}
        />
        <Text accessibilityRole="button" style={styles.link} onPress={isConfirming ? resetEntry : onExit}>
          {isConfirming ? 'Re-enter new MPIN' : 'Cancel Reset'}
        </Text>
      </View>
    </PasswordRecoveryLayout>
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
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 22 },
  dot: { width: 15, height: 15, borderRadius: 8, backgroundColor: '#cbd5e1' },
  filledDot: { backgroundColor: '#2563eb' },
  error: { alignItems: 'center', paddingRight: 4 },
  keypad: { marginTop: 12 },
  link: { alignSelf: 'center', padding: 12, marginTop: 20, color: '#2563eb', fontFamily: 'GoogleSans-Bold' },
});
