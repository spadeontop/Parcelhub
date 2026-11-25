import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
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
import { FormCardHeader } from '../common/FormCardHeader';
import { SuccessBadge } from '../common/SuccessBadge';
import { isValidEmail } from '../../utils/authValidation';
import { VerificationCodeInput } from '../common/VerificationCodeInput';
import { AuthSheetLayout } from '../layout/AuthSheetLayout';

type Step = 'email' | 'code' | 'reset' | 'success';

export interface RecoveryCopy {
  title: string;
  subtitle: string;
  sendLabel: string;
  rememberPrompt: string;
  exitLabel: string;
  verifyTitle: string;
  codePrompt: string;
  changeEmailLabel: string;
  successTitle: string;
  successDescription: string;
  doneLabel: string;
}

interface RecoveryFlowProps {
  copy: RecoveryCopy;
  onExit: () => void;
  onDone?: () => void;
  onRequestCode?: (email: string) => Promise<{ retryAfterSeconds?: number } | void>;
  onVerifyCode?: (email: string, code: string) => Promise<{ resetToken?: string } | void>;
  renderReset: (actions: {
    email: string;
    resetToken: string;
    onBack: () => void;
    onComplete: () => void;
  }) => ReactNode;
}

const CODE_LENGTH = 6;
const RESEND_DELAY_SECONDS = 60;

export function RecoveryFlow({
  copy,
  onExit,
  onDone,
  onRequestCode,
  onVerifyCode,
  renderReset,
}: RecoveryFlowProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<{ field: Step; message: string } | null>(null);
  const [resendDeadline, setResendDeadline] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(0);

  const showStep = useCallback((next: Step) => {
    Keyboard.dismiss();
    setError(null);
    setStep(next);
  }, []);

  const goBack = useCallback(() => {
    if (step === 'code') {
      showStep('email');
    } else {
      onExit();
    }
  }, [onExit, showStep, step]);

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
    if (step === 'reset') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [goBack, step]);

  const startCodeEntry = (retryAfterSeconds?: number) => {
    const delaySeconds =
      typeof retryAfterSeconds === 'number' && retryAfterSeconds > 0
        ? retryAfterSeconds
        : RESEND_DELAY_SECONDS;
    setCode('');
    setError(null);
    setResendSeconds(delaySeconds);
    setResendDeadline(Date.now() + delaySeconds * 1000);
  };

  const requestCode = async () => {
    if (isSubmitting) return;
    const address = email.trim();
    if (!isValidEmail(address)) {
      setError({ field: 'email', message: 'Enter a valid email address.' });
      return;
    }

    setEmail(address);
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await onRequestCode?.(address);
      startCodeEntry(res?.retryAfterSeconds);
      showStep('code');
    } catch (err) {
      setError({
        field: 'email',
        message: err instanceof Error ? err.message : 'Unable to send verification code. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendCode = async () => {
    if (isSubmitting || resendSeconds > 0) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await onRequestCode?.(email);
      startCodeEntry(res?.retryAfterSeconds);
    } catch (err) {
      setError({
        field: 'code',
        message: err instanceof Error ? err.message : 'Unable to resend verification code. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyCode = async () => {
    if (isSubmitting) return;
    if (code.length !== CODE_LENGTH) {
      setError({ field: 'code', message: 'Enter the 6-digit verification code.' });
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await onVerifyCode?.(email, code);
      setResetToken(res?.resetToken ?? '');
      showStep('reset');
    } catch (err) {
      setError({
        field: 'code',
        message: err instanceof Error ? err.message : 'Invalid or expired verification code.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'reset') {
    return renderReset({
      email,
      resetToken,
      onBack: () => showStep('code'),
      onComplete: () => {
        setCode('');
        setResetToken('');
        showStep('success');
      },
    });
  }

  const resendTime = `${Math.floor(resendSeconds / 60)}:${String(resendSeconds % 60).padStart(2, '0')}`;

  if (step === 'success') {
    return (
      <AuthSheetLayout>
        <View style={styles.successContent}>
          <SuccessBadge />
          <Text accessibilityRole="header" style={styles.successTitle}>{copy.successTitle}</Text>
          <Text style={[styles.description, styles.centerText, styles.successDescription]}>
            {copy.successDescription}
          </Text>
        </View>
        <View style={styles.successAction}>
          <AuthButton label={copy.doneLabel} onPress={onDone ?? onExit} />
        </View>
      </AuthSheetLayout>
    );
  }

  return (
    <AuthSheetLayout onBack={goBack}>
      <View style={styles.form}>
        {step === 'email' && (
          <>
            <FormCardHeader
              step={1}
              totalSteps={3}
              title={copy.title}
              subtitle={copy.subtitle}
            />
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
              <AuthButton label={copy.sendLabel} onPress={requestCode} isLoading={isSubmitting} />
            </View>
            <Text style={styles.footer}>
              {copy.rememberPrompt}{' '}
              <Text accessibilityRole="link" onPress={onExit} style={styles.link}>{copy.exitLabel}</Text>
            </Text>
          </>
        )}

        {step === 'code' && (
          <>
            <FormCardHeader
              step={2}
              totalSteps={3}
              title={copy.verifyTitle}
              subtitle={<>{copy.codePrompt} <Text style={styles.emailAddress}>{email}</Text></>}
            />
            <View style={styles.codeField}>
              <VerificationCodeInput
                autoFocus
                value={code}
                length={CODE_LENGTH}
                onChangeText={(value) => { setCode(value); setError(null); }}
                onSubmit={verifyCode}
              />
              {error?.field === 'code' && <FieldError message={error.message} />}
            </View>
            <View style={styles.codeAction}>
              <AuthButton label="Verify Code" onPress={verifyCode} isLoading={isSubmitting} />
            </View>
            <Text style={styles.footer}>
              Didn&apos;t receive a code?{' '}
              {resendSeconds > 0 ? (
                <Text style={styles.resendDisabled}>Resend in {resendTime}</Text>
              ) : (
                <Text
                  accessibilityRole="button"
                  onPress={resendCode}
                  style={isSubmitting ? styles.resendDisabled : styles.link}
                >
                  Resend
                </Text>
              )}
            </Text>
            <Text accessibilityRole="link" onPress={goBack} style={styles.changeEmail}>{copy.changeEmailLabel}</Text>
          </>
        )}

      </View>
    </AuthSheetLayout>
  );
}

const styles = StyleSheet.create({
  form: { paddingTop: 20 },
  successTitle: {
    color: '#1e293b', fontFamily: 'GoogleSans-Bold', fontSize: 20, lineHeight: 25,
    marginTop: 16, textAlign: 'center', includeFontPadding: false,
  },
  description: { color: '#64748b', fontFamily: 'GoogleSans-Regular', fontSize: 13.5, lineHeight: 19, marginTop: 3, includeFontPadding: false },
  emailAddress: { color: '#0f172a', fontFamily: 'GoogleSans-Bold' },
  field: { marginBottom: 0 },
  emailField: { marginTop: 4 },
  emailAction: { marginTop: 16 },
  codeField: { marginTop: 16 },
  codeAction: { marginTop: 16 },
  footer: {
    color: '#64748b',
    fontFamily: 'GoogleSans-Regular',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 20,
    includeFontPadding: false,
  },
  link: { color: '#2563eb', fontFamily: 'GoogleSans-Bold' },
  changeEmail: {
    alignSelf: 'center',
    color: '#2563eb',
    fontFamily: 'GoogleSans-Bold',
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 8,
    includeFontPadding: false,
  },
  resendDisabled: { color: '#94a3b8', fontFamily: 'GoogleSans-Bold' },
  successContent: { paddingTop: 48, alignItems: 'center' },
  centerText: { textAlign: 'center' },
  successDescription: { marginTop: 6 },
  successAction: { marginTop: 34 },
});
