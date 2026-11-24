import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
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

export function MpinCreateScreen() {
  const { resetNavigationTo } = useNavigationUi();
  const { showToast } = useToast();
  const { customer, preAuthToken, createCustomerMpin } = useAuthSession();
  const [newPin, setNewPin] = useState('');
  const [entry, setEntry] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const savingRef = useRef(false);
  const isConfirming = newPin.length === MPIN_LENGTH;

  const editEntry = (value: string) => {
    if (savingRef.current) return;
    setEntry(value);
    setError('');
  };

  const restart = useCallback(() => {
    if (savingRef.current) return;
    setNewPin('');
    setEntry('');
    setError('');
  }, []);

  const goHome = useCallback(() => resetNavigationTo('home'), [resetNavigationTo]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (savingRef.current) return true;
      if (isComplete) goHome();
      else if (isConfirming) restart();
      else resetNavigationTo('login');
      return true;
    });
    return () => subscription.remove();
  }, [goHome, isComplete, isConfirming, resetNavigationTo, restart]);

  const saveMpin = async (pin: string) => {
    savingRef.current = true;
    setIsSaving(true);

    try {
      await createCustomerMpin(pin);
      setEntry('');
      setNewPin('');
      setIsComplete(true);
    } catch (err) {
      const message = err instanceof Error && err.message
        ? err.message
        : 'Failed to create MPIN. Please try again.';

      if (
        err instanceof V1ApiError &&
        (err.statusCode === 401 || err.statusCode === 409 ||
          err.error === 'Unauthorized' || err.error === 'Conflict')
      ) {
        showToast(message);
        resetNavigationTo('login');
      } else {
        setEntry('');
        setError(message);
      }
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const pressDigit = (digit: string) => {
    if (savingRef.current || entry.length >= MPIN_LENGTH) return;

    const next = entry + digit;
    setError('');

    if (next.length < MPIN_LENGTH) {
      setEntry(next);
    } else if (!isConfirming) {
      setNewPin(next);
      setEntry('');
    } else if (next === newPin) {
      if (preAuthToken) {
        setEntry(next);
        void saveMpin(next);
      } else {
        setEntry('');
        setNewPin('');
        setIsComplete(true);
      }
    } else {
      setEntry('');
      setError('MPINs do not match. Try again.');
    }
  };

  if (isComplete) {
    return (
      <AuthSheetLayout sheetStyle={styles.sheet}>
        <View style={styles.successContent}>
          <SuccessBadge />
          <Text accessibilityRole="header" style={styles.successTitle}>You&apos;re all set!</Text>
          <Text style={styles.successDescription}>
            {'Your account and 4-digit MPIN are ready.\nStart tracking orders and hub pickups now.'}
          </Text>
        </View>
        <View style={styles.successAction}>
          <AuthButton label="Continue" onPress={goHome} />
        </View>
      </AuthSheetLayout>
    );
  }

  return (
    <AuthSheetLayout
      onBack={isConfirming && !isSaving ? restart : undefined}
      sheetStyle={[styles.sheet, styles.entrySheet]}
    >
      <View style={styles.entryContent}>
        <View style={styles.account}>
          <Text style={styles.email} numberOfLines={1}>{customer?.email || '—'}</Text>
          <Text style={styles.step}>STEP 3 OF 3</Text>
        </View>

        <Text accessibilityRole="header" style={styles.title}>
          {isConfirming ? 'Confirm your 4-digit MPIN' : 'Set up your 4-digit MPIN'}
        </Text>
        <Text style={styles.subtitle}>
          {isConfirming ? 'Re-enter your PIN to finish setting up' : 'Secures parcel claims and quick logins'}
        </Text>

        <MpinDots filledCount={entry.length} style={styles.dots} />
        <View style={styles.feedback}>
          {isSaving ? (
            <ActivityIndicator accessibilityLabel="Saving MPIN" size="small" color="#2563eb" />
          ) : error ? (
            <FieldError message={error} />
          ) : null}
        </View>
        <NumericKeypad
          onPressDigit={pressDigit}
          onPressBackspace={() => editEntry(entry.slice(0, -1))}
          onPressClear={() => editEntry('')}
          disabled={isSaving}
          style={styles.keypad}
        />
      </View>

      {isConfirming && (
        <View style={styles.restartAction}>
          <Pressable accessibilityRole="button" onPress={restart} disabled={isSaving} style={styles.restartButton}>
            <Text style={[styles.restartLabel, isSaving && styles.savingLabel]}>Re-enter new MPIN</Text>
          </Pressable>
        </View>
      )}
    </AuthSheetLayout>
  );
}

const styles = StyleSheet.create({
  sheet: { paddingHorizontal: 24 },
  entrySheet: { backgroundColor: '#f8fafc', paddingBottom: 16 },
  entryContent: { paddingTop: 20 },
  account: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  email: { flexShrink: 1, color: '#1e293b', fontFamily: 'GoogleSans-SemiBold', fontSize: 15 },
  step: { color: '#2563eb', fontFamily: 'GoogleSans-Bold', fontSize: 11 },
  title: {
    marginTop: 20, textAlign: 'center', color: '#0f172a',
    fontFamily: 'GoogleSans-Bold', fontSize: 20, lineHeight: 25,
  },
  subtitle: {
    marginTop: 2, textAlign: 'center', color: '#64748b',
    fontFamily: 'GoogleSans-Regular', fontSize: 13, lineHeight: 18,
  },
  dots: { marginTop: 22 },
  feedback: { minHeight: 38, alignItems: 'center', justifyContent: 'center', paddingRight: 4 },
  keypad: { maxWidth: 264 },
  restartAction: { marginTop: 'auto', paddingTop: 20, alignItems: 'center' },
  restartButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  restartLabel: { color: '#2563eb', fontFamily: 'GoogleSans-Bold', fontSize: 13.5 },
  savingLabel: { color: '#64748b' },
  successContent: { alignItems: 'center', paddingTop: 82 },
  successTitle: {
    marginTop: 16, textAlign: 'center', color: '#0f172a',
    fontFamily: 'GoogleSans-Bold', fontSize: 22, lineHeight: 28,
  },
  successDescription: {
    marginTop: 6, textAlign: 'center', color: '#64748b',
    fontFamily: 'GoogleSans-Regular', fontSize: 13.5, lineHeight: 19,
  },
  successAction: { marginTop: 40 },
});

export default MpinCreateScreen;
