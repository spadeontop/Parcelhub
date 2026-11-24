import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import {
  BackHandler,
  Keyboard,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AuthButton } from '../common/AuthButton';
import { FloatingInput } from '../common/FloatingInput';
import { FieldError } from '../common/FieldError';
import { getPasswordRequirements, isValidEmail } from '../../utils/authValidation';
import { VerificationCodeInput } from '../common/VerificationCodeInput';
import { PasswordRecoveryLayout } from '../layout/PasswordRecoveryLayout';

type Step = 'email' | 'code' | 'password' | 'success';

const CODE_LENGTH = 6;
const RESEND_DELAY_SECONDS = 60;

function StepHeading({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <View>
      <Text style={styles.step}>STEP {step} OF 3</Text>
      <Text accessibilityRole="header" style={styles.heading}>{title}</Text>
      <Text style={styles.description}>{children}</Text>
    </View>
  );
}

function RecoveryAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <AuthButton label={label} onPress={onPress} style={styles.button} labelStyle={styles.buttonLabel} />
  );
}

export function PasswordRecoveryScreen({ onSignIn }: { onSignIn: () => void }) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<{ field: Step | 'confirmation'; message: string } | null>(null);
  const [resendDeadline, setResendDeadline] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(0);

  const showStep = useCallback((next: Step) => {
    Keyboard.dismiss();
    setError(null);
    setStep(next);
  }, []);

  const goBack = useCallback(() => {
    if (step === 'password') {
      setPassword('');
      setConfirmation('');
      showStep('code');
    } else if (step === 'code') {
      showStep('email');
    } else {
      onSignIn();
    }
  }, [onSignIn, showStep, step]);

  useEffect(() => {
    if (step !== 'code' || resendDeadline === 0) return;

    const update = () => {
      const seconds = Math.max(0, Math.ceil((resendDeadline - Date.now()) / 1000));
      setResendSeconds(seconds);
      if (seconds === 0) setResendDeadline(0);
    };
    const interval = setInterval(update, 1000);
    update();
    return () => clearInterval(interval);
  }, [step, resendDeadline]);

  useEffect(() => {
    if (step !== 'code' && step !== 'password') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [goBack, step]);

  const startCodeEntry = () => {
    setCode('');
    setError(null);
    setResendSeconds(RESEND_DELAY_SECONDS);
    setResendDeadline(Date.now() + RESEND_DELAY_SECONDS * 1000);
  };

  const requestCode = () => {
    const address = email.trim();
    if (!isValidEmail(address)) {
      setError({ field: 'email', message: 'Enter a valid email address.' });
      return;
    }

    setEmail(address);
    startCodeEntry();
    showStep('code');
  };

  const verifyCode = () => {
    if (code.length !== CODE_LENGTH) {
      setError({ field: 'code', message: 'Enter the 6-digit verification code.' });
      return;
    }
    showStep('password');
  };

  const updatePassword = () => {
    if (!Object.values(getPasswordRequirements(password)).every(Boolean)) {
      setError({ field: 'password', message: 'Use at least 8 characters with uppercase and lowercase letters, a number, and a symbol.' });
      return;
    }
    if (password !== confirmation) {
      setError({ field: 'confirmation', message: 'Passwords do not match.' });
      return;
    }

    setCode('');
    setPassword('');
    setConfirmation('');
    showStep('success');
  };

  const resendTime = `${Math.floor(resendSeconds / 60)}:${String(resendSeconds % 60).padStart(2, '0')}`;

  if (step === 'success') {
    return (
      <PasswordRecoveryLayout>
        <View style={styles.successContent}>
          <View style={styles.successIcon} aria-hidden>
            <Image source={require('../../../assets/password-recovery/success-halo.svg')} style={styles.successHalo} />
            <Image source={require('../../../assets/password-recovery/success-circle.svg')} style={styles.successCircle} />
            <Image source={require('../../../assets/password-recovery/success-check.svg')} style={styles.successCheck} />
          </View>
          <Text accessibilityRole="header" style={[styles.heading, styles.centerText]}>Password updated</Text>
          <Text style={[styles.description, styles.centerText, styles.successDescription]}>
            Your password has been reset successfully.{'\n'}You can now sign in with your new password.
          </Text>
        </View>
        <View style={styles.successAction}>
          <RecoveryAction label="Back to Sign In" onPress={onSignIn} />
        </View>
      </PasswordRecoveryLayout>
    );
  }

  return (
    <PasswordRecoveryLayout onBack={goBack}>
      <View style={styles.form}>
        {step === 'email' && (
          <>
            <StepHeading step={1} title="Reset password">
              Enter your registered email and we&apos;ll send{'\n'}a 6-digit verification code to reset it.
            </StepHeading>
            <View style={styles.emailField}>
              <FloatingInput
                label="Email"
                accessibilityLabel="Email"
                autoCapitalize="none"
                autoCorrect={false}
                error={error?.field === 'email' ? error.message : undefined}
                containerStyle={styles.field}
                value={email}
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={(value) => { setEmail(value); setError(null); }}
                onSubmitEditing={requestCode}
                returnKeyType="done"
              />
            </View>
            <View style={styles.emailAction}>
              <RecoveryAction label="Send Reset Code" onPress={requestCode} />
            </View>
            <Text style={styles.footer}>
              Remember your password?{' '}
              <Text accessibilityRole="link" onPress={onSignIn} style={styles.link}>Sign In</Text>
            </Text>
          </>
        )}

        {step === 'code' && (
          <>
            <StepHeading step={2} title="Enter verification code">
              We sent a 6-digit code to <Text style={styles.emailAddress}>{email}</Text>
            </StepHeading>
            <Text accessibilityRole="link" onPress={goBack} style={styles.changeEmail}>Change email</Text>
            <View style={styles.codeField}>
              <VerificationCodeInput
                value={code}
                length={CODE_LENGTH}
                digitStyle={styles.codeDigit}
                onChangeText={(value) => { setCode(value); setError(null); }}
                onSubmit={verifyCode}
              />
              {error?.field === 'code' && <FieldError message={error.message} />}
            </View>
            <View style={styles.codeAction}>
              <RecoveryAction label="Verify Code" onPress={verifyCode} />
            </View>
            <Text style={styles.footer}>
              Didn&apos;t receive a code?{' '}
              {resendSeconds > 0 ? (
                <Text style={styles.resendDisabled}>Resend in {resendTime}</Text>
              ) : (
                <Text accessibilityRole="button" onPress={startCodeEntry} style={styles.link}>Resend</Text>
              )}
            </Text>
          </>
        )}

        {step === 'password' && (
          <>
            <StepHeading step={3} title="Create new password">
              Choose a strong password for your
            </StepHeading>
            <View style={styles.passwordFields}>
              <FloatingInput
                label="New password"
                accessibilityLabel="New password"
                autoCapitalize="none"
                autoCorrect={false}
                error={error?.field === 'password' ? error.message : undefined}
                containerStyle={styles.field}
                isPassword
                value={password}
                onChangeText={(value) => { setPassword(value); setError(null); }}
              />
              <FloatingInput
                label="Confirm new password"
                accessibilityLabel="Confirm new password"
                autoCapitalize="none"
                autoCorrect={false}
                error={error?.field === 'confirmation' ? error.message : undefined}
                containerStyle={styles.field}
                isPassword
                value={confirmation}
                onChangeText={(value) => { setConfirmation(value); setError(null); }}
                onSubmitEditing={updatePassword}
                returnKeyType="done"
              />
            </View>
            <View style={styles.passwordAction}>
              <RecoveryAction label="Update Password" onPress={updatePassword} />
            </View>
          </>
        )}
      </View>
    </PasswordRecoveryLayout>
  );
}

const styles = StyleSheet.create({
  form: { paddingTop: 20 },
  step: { color: '#1d5ce6', fontFamily: 'RecoveryInter-Bold', fontSize: 11, lineHeight: 16, includeFontPadding: false },
  heading: { color: '#0f172a', fontFamily: 'RecoveryInter-Bold', fontSize: 22, lineHeight: 28, includeFontPadding: false },
  description: { color: '#64748b', fontFamily: 'RecoveryInter-Regular', fontSize: 13.5, lineHeight: 19, marginTop: 3, includeFontPadding: false },
  emailAddress: { color: '#0f172a', fontFamily: 'RecoveryInter-Bold' },
  field: { marginBottom: 0 },
  emailField: { marginTop: 25 },
  emailAction: { marginTop: 26 },
  codeField: { marginTop: 22 },
  codeDigit: { fontFamily: 'RecoveryInter-Bold', fontWeight: 'normal' },
  codeAction: { marginTop: 28 },
  passwordFields: { marginTop: 40, gap: 14 },
  passwordAction: { marginTop: 50 },
  button: { height: 48, backgroundColor: '#1d5ce6', shadowOpacity: 0, elevation: 0 },
  buttonLabel: {
    fontFamily: 'RecoveryInter-Bold',
    fontSize: 15,
    fontWeight: 'normal',
    lineHeight: 19,
    includeFontPadding: false,
  },
  footer: {
    color: '#64748b',
    fontFamily: 'RecoveryInter-Regular',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 20,
    includeFontPadding: false,
  },
  link: { color: '#1d5ce6', fontFamily: 'RecoveryInter-Bold' },
  changeEmail: {
    alignSelf: 'flex-start',
    color: '#1d5ce6',
    fontFamily: 'RecoveryInter-Bold',
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
    includeFontPadding: false,
  },
  resendDisabled: { color: '#94a3b8', fontFamily: 'RecoveryInter-Bold' },
  successContent: { paddingTop: 64, alignItems: 'center' },
  successIcon: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successHalo: { width: 96, height: 96 },
  successCircle: { width: 64, height: 64, position: 'absolute', left: 16, top: 16 },
  successCheck: { width: 30, height: 21.5, position: 'absolute', left: 33, top: 37.25 },
  centerText: { textAlign: 'center' },
  successDescription: { marginTop: 6 },
  successAction: { marginTop: 34 },
});
