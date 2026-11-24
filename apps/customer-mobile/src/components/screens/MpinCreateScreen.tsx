import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, Text, View } from 'react-native';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useNavigationUi } from '../../context/NavigationAndUiContext';
import { useToast } from '../../context/ToastContext';
import { V1ApiError } from '../../services/apiClient';
import { AuthButton } from '../common/AuthButton';
import { FieldError } from '../common/FieldError';
import { MpinDots, MPIN_LENGTH } from '../common/MpinDots';
import { NumericKeypad } from '../common/NumericKeypad';
import { SuccessBadge } from '../common/SuccessBadge';
import { AuthSheetLayout } from '../layout/AuthSheetLayout';

type Step = 'create' | 'confirm' | 'success';
type Submission = 'idle' | 'pending' | 'complete';

export function MpinCreateScreen() {
  const { resetNavigationTo } = useNavigationUi();
  const { showToast } = useToast();
  const { customer, createCustomerMpin } = useAuthSession();

  const [step, setStep] = useState<Step>('create');
  const [digitCount, setDigitCount] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstPin = useRef('');
  const entry = useRef('');
  const submission = useRef<Submission>('idle');

  const goHome = useCallback(() => resetNavigationTo('home'), [resetNavigationTo]);

  const restart = useCallback(() => {
    if (submission.current !== 'idle') return;
    firstPin.current = '';
    entry.current = '';
    setDigitCount(0);
    setFeedback('');
    setStep('create');
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (submission.current === 'complete') goHome();
      else if (submission.current === 'idle') {
        if (firstPin.current) restart();
        else resetNavigationTo('login');
      }
      return true;
    });
    return () => subscription.remove();
  }, [goHome, resetNavigationTo, restart]);

  const updateEntry = (value: string) => {
    if (submission.current !== 'idle') return;
    entry.current = value;
    setDigitCount(value.length);
    setFeedback('');
  };

  const submit = async (pin: string) => {
    submission.current = 'pending';
    setIsSubmitting(true);
    try {
      await createCustomerMpin(pin);
      submission.current = 'complete';
      firstPin.current = '';
      entry.current = '';
      setDigitCount(0);
      setStep('success');
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : 'Failed to create MPIN. Please try again.';
      submission.current = 'idle';
      updateEntry('');
      if (error instanceof V1ApiError && (
        error.statusCode === 401 || error.statusCode === 409 ||
        error.error === 'Unauthorized' || error.error === 'Conflict'
      )) {
        showToast(message);
        resetNavigationTo('login');
      } else {
        setFeedback(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const pressDigit = (digit: string) => {
    if (submission.current !== 'idle') return;
    const next = entry.current + digit;
    updateEntry(next);
    if (next.length < MPIN_LENGTH) return;

    if (!firstPin.current) {
      firstPin.current = next;
      updateEntry('');
      setStep('confirm');
    } else if (next !== firstPin.current) {
      updateEntry('');
      setFeedback('MPINs do not match. Try again.');
    } else {
      void submit(next);
    }
  };

  if (step === 'success') {
    return (
      <AuthSheetLayout sheetStyle={styles.sheet}>
        <View style={styles.success}>
          <SuccessBadge />
          <Text accessibilityRole="header" style={[styles.title, styles.successTitle]}>
            You&apos;re all set!
          </Text>
          <Text style={styles.successDescription}>
            {'Your account and 4-digit MPIN are ready.\nStart tracking orders and hub pickups now.'}
          </Text>
        </View>
        <View style={styles.homeButton}>
          <AuthButton label="Go to Home" onPress={goHome} />
        </View>
      </AuthSheetLayout>
    );
  }

  const isConfirming = step === 'confirm';

  return (
    <AuthSheetLayout onBack={isConfirming ? restart : undefined} sheetStyle={[styles.sheet, styles.setupSheet]}>
      <View>
        <View style={styles.account}>
          <Text style={styles.email}>{customer?.email || '—'}</Text>
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          {isConfirming ? 'Confirm your 4-digit MPIN' : 'Set up your 4-digit MPIN'}
        </Text>
        <Text style={styles.subtitle}>
          {isConfirming ? 'Re-enter your PIN to finish setting up' : 'Secures parcel claims and quick logins'}
        </Text>
        <MpinDots count={digitCount} />
        <View style={styles.feedback}>
          {isSubmitting && <ActivityIndicator accessibilityLabel="Activating MPIN" color="#2563eb" size="small" />}
          {!!feedback && <FieldError message={feedback} centered />}
        </View>
        <NumericKeypad
          onPressDigit={pressDigit}
          onPressBackspace={() => updateEntry(entry.current.slice(0, -1))}
          onPressClear={() => updateEntry('')}
          style={styles.keypad}
        />
      </View>
      {isConfirming && (
        <Text accessibilityRole="button" onPress={restart} style={styles.link}>
          Re-enter new MPIN
        </Text>
      )}
    </AuthSheetLayout>
  );
}

const styles = StyleSheet.create({
  sheet: { paddingHorizontal: 24 },
  setupSheet: { backgroundColor: '#f5f8fa', justifyContent: 'space-between' },
  account: {
    marginTop: 20, paddingVertical: 12, paddingHorizontal: 24,
    borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 12, backgroundColor: '#fff',
  },
  email: { color: '#1e293b', fontFamily: 'GoogleSans-SemiBold', fontSize: 15 },
  title: { marginTop: 20, textAlign: 'center', color: '#0f172a', fontFamily: 'GoogleSans-Bold', fontSize: 20 },
  subtitle: { textAlign: 'center', color: '#64748b', fontFamily: 'GoogleSans-Regular', fontSize: 13 },
  feedback: { minHeight: 18, justifyContent: 'center' },
  keypad: { maxWidth: 264, marginTop: 2 },
  link: {
    alignSelf: 'center', padding: 12, marginTop: 20,
    color: '#2563eb', fontFamily: 'GoogleSans-Bold', fontSize: 14,
  },
  success: { paddingTop: 80, alignItems: 'center' },
  successTitle: { marginTop: 16, fontSize: 22 },
  successDescription: {
    marginTop: 6, textAlign: 'center', color: '#64748b', fontFamily: 'GoogleSans-Regular',
    fontSize: 14, lineHeight: 19,
  },
  homeButton: { marginTop: 40 },
});

export default MpinCreateScreen;
