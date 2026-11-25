import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { AuthButton } from '../common/AuthButton';
import { FloatingInput } from '../common/FloatingInput';
import { FormCardHeader } from '../common/FormCardHeader';
import { PasswordRequirements } from '../common/PasswordRequirements';
import { getPasswordRequirements } from '../../utils/authValidation';
import { authApi } from '../../services/authApi';
import { AuthSheetLayout } from '../layout/AuthSheetLayout';
import { RecoveryFlow, type RecoveryCopy } from './RecoveryFlow';

const copy: RecoveryCopy = {
  title: 'Reset password',
  subtitle: 'Enter your registered email to receive a 6-digit verification code.',
  sendLabel: 'Send Reset Code',
  rememberPrompt: 'Remember your password?',
  exitLabel: 'Sign In',
  verifyTitle: 'Enter verification code',
  codePrompt: 'We sent a 6-digit code to',
  changeEmailLabel: 'Not You?',
  successTitle: 'Password updated',
  successDescription: 'Your password has been reset successfully.\nYou can now sign in with your new password.',
  doneLabel: 'Back to Sign In',
};

export function PasswordRecoveryScreen({ onSignIn }: { onSignIn: () => void }) {
  return (
    <RecoveryFlow
      copy={copy}
      onExit={onSignIn}
      onRequestCode={(email) => authApi.forgotPassword({ email })}
      onVerifyCode={(email, code) => authApi.verifyPasswordResetOtp({ email, code })}
      renderReset={(actions) => <PasswordStep {...actions} />}
    />
  );
}

function PasswordStep({
  resetToken,
  onBack,
  onComplete,
}: {
  resetToken: string;
  onBack: () => void;
  onComplete: () => void;
}) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<{ field: 'password' | 'confirmation'; message: string } | null>(null);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => subscription.remove();
  }, [onBack]);

  const updatePassword = async () => {
    if (isSubmitting) return;
    if (!Object.values(getPasswordRequirements(password)).every(Boolean)) {
      setError({ field: 'password', message: 'Use at least 8 characters with uppercase and lowercase letters, a number, and a symbol.' });
      return;
    }
    if (password !== confirmation) {
      setError({ field: 'confirmation', message: 'Passwords do not match.' });
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await authApi.resetPassword({ resetToken, newPassword: password });
      onComplete();
    } catch (err) {
      setError({
        field: 'confirmation',
        message: err instanceof Error ? err.message : 'Unable to update password. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthSheetLayout onBack={onBack}>
      <View style={styles.form}>
        <FormCardHeader
          step={3}
          totalSteps={3}
          title="Create new password"
          subtitle="Choose a strong password for your account."
        />
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
          <PasswordRequirements password={password} />
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
          <AuthButton label="Update Password" onPress={updatePassword} isLoading={isSubmitting} />
        </View>
      </View>
    </AuthSheetLayout>
  );
}

const styles = StyleSheet.create({
  form: { paddingTop: 20 },
  field: { marginBottom: 0 },
  passwordFields: { marginTop: 4, gap: 14 },
  passwordAction: { marginTop: 16 },
});
