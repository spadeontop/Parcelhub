import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { useNavigationUi } from '../../context/NavigationAndUiContext';
import { useToast } from '../../context/ToastContext';
import { useAuthSession } from '../../context/AuthSessionContext';
import { AuthBrandHeader } from '../layout/AuthBrandHeader';
import { FormCardHeader } from '../common/FormCardHeader';
import { FloatingInput } from '../common/FloatingInput';
import { AuthButton } from '../common/AuthButton';
import { PasswordRequirements } from '../common/PasswordRequirements';
import { VerificationCodeInput } from '../common/VerificationCodeInput';
import { FieldError } from '../common/FieldError';
import { getPasswordRequirements, isValidEmail } from '../../utils/authValidation';
import { authApi } from '../../services/authApi';

const DEFAULT_RESEND_DELAY_SECONDS = 60;

export const RegisterScreen: React.FC = () => {
  const { navigateTo } = useNavigationUi();
  const { showToast } = useToast();
  const { registerCustomer, verifyCustomerEmail } = useAuthSession();

  const { height } = useWindowDimensions();
  const isCompact = height < 700;

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form states matching CustomerRegisterReq
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationCodeError, setVerificationCodeError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendDeadline, setResendDeadline] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (currentStep !== 3 || resendDeadline === 0) return;

    const update = () => {
      const seconds = Math.max(0, Math.ceil((resendDeadline - Date.now()) / 1000));
      setResendSeconds(seconds);
      if (seconds === 0) setResendDeadline(0);
    };
    const interval = setInterval(update, 1000);
    update();
    return () => clearInterval(interval);
  }, [currentStep, resendDeadline]);

  const startResendCooldown = (retryAfterSeconds?: number) => {
    const delaySeconds =
      typeof retryAfterSeconds === 'number' && retryAfterSeconds > 0
        ? retryAfterSeconds
        : DEFAULT_RESEND_DELAY_SECONDS;
    setResendSeconds(delaySeconds);
    setResendDeadline(Date.now() + delaySeconds * 1000);
  };

  // Validation rules for Step 1
  const isFirstNameValid = firstName.trim().length >= 1;
  const isLastNameValid = lastName.trim().length >= 1;
  const isStep1Valid = isFirstNameValid && isLastNameValid;

  // Validation rules for Step 2
  const isEmailValid = isValidEmail(email);
  const isPhoneValid = (() => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return /^(\+63|0)?9\d{9}$/.test(cleaned) || (cleaned.length >= 10 && /^\+?\d+$/.test(cleaned));
  })();
  const { hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSymbol } = getPasswordRequirements(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;
  const isConfirmPasswordValid = Boolean(
    isPasswordValid && confirmPassword.length > 0 && confirmPassword === password
  );
  const isStep2Valid = isEmailValid && isPhoneValid && isPasswordValid && isConfirmPasswordValid && !emailError;

  const handleNextStep = () => {
    Keyboard.dismiss();
    if (!isStep1Valid) {
      if (!isFirstNameValid) showToast('Please enter your first name.');
      else if (!isLastNameValid) showToast('Please enter your last name.');
      return;
    }
    setCurrentStep(2);
  };

  const handleAccountNext = async () => {
    Keyboard.dismiss();
    if (isLoading) return;

    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    if (!isEmailValid) {
      setEmailError('Please enter a valid email.');
      showToast('Please enter a valid email.');
      return;
    }
    if (!isPhoneValid) {
      showToast('Please enter a valid phone number.');
      return;
    }
    if (!isPasswordValid) {
      setPasswordError('Password must have uppercase, lowercase, number & symbol.');
      showToast('Password must have uppercase, lowercase, number & symbol.');
      return;
    }
    if (!isConfirmPasswordValid) {
      setConfirmPasswordError('Passwords do not match.');
      showToast('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerCustomer({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleInitial: middleInitial.trim() || undefined,
        phoneNumber: phone.trim(),
      });

      if (res.emailVerificationRequired) {
        setVerificationCode('');
        setVerificationCodeError('');
        if (res.verificationEmailSent !== false) {
          startResendCooldown(res.retryAfterSeconds);
        } else {
          setResendDeadline(0);
          setResendSeconds(0);
        }
        setCurrentStep(3);
      }
    } catch (err: any) {
      const statusCode = err?.statusCode;
      const message = err?.message || 'Registration failed';
      const isPendingVerification = err?.error === 'EmailPendingVerification';
      const isConflict =
        statusCode === 409 ||
        err?.error === 'Conflict' ||
        message.toLowerCase().includes('already exists');

      if (isPendingVerification) {
        setVerificationCode('');
        setVerificationCodeError('');
        setResendDeadline(0);
        setResendSeconds(0);
        showToast(message);
        setCurrentStep(3);
      } else if (isConflict) {
        setEmailError(message);
        setCurrentStep(2);
      } else {
        showToast(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    Keyboard.dismiss();
    setCurrentStep(1);
    setFirstName('');
    setLastName('');
    setMiddleInitial('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setVerificationCode('');
    setVerificationCodeError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setResendDeadline(0);
    setResendSeconds(0);
    navigateTo('login');
  };

  const handleVerifyCode = async () => {
    Keyboard.dismiss();
    if (isLoading) return;
    if (verificationCode.length !== 6) {
      setVerificationCodeError('Enter the 6-digit verification code.');
      return;
    }

    setVerificationCodeError('');
    setIsLoading(true);
    try {
      await verifyCustomerEmail({
        email: email.trim(),
        code: verificationCode.trim(),
      });
    } catch (err: any) {
      const message = err?.message || 'Invalid or expired verification code.';
      setVerificationCodeError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (isLoading || isResending || resendSeconds > 0) return;

    setIsResending(true);
    try {
      const res = await authApi.sendEmailVerification({ email: email.trim() });
      setVerificationCode('');
      setVerificationCodeError('');
      startResendCooldown(res.retryAfterSeconds);
      showToast(res.statusMessage || 'Verification code sent.');
    } catch (err: any) {
      showToast(err?.message || 'Unable to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View className="flex-1 bg-[#2563eb]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-[#2563eb]"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View className="flex-1 bg-[#2563eb]">
            {/* Header */}
            <AuthBrandHeader
              title="ParcelHub"
              subtitle={
                currentStep === 1
                  ? 'Create your account'
                  : currentStep === 2
                    ? 'Almost there — secure your account'
                    : 'Verify your email'
              }
              onBack={currentStep === 1 ? handleBackToLogin : () => { Keyboard.dismiss(); setCurrentStep(currentStep === 3 ? 2 : 1); }}
            />

            {/* Main non-scrollable sheet with curved top transition */}
            <View
              className="flex-1 bg-white rounded-t-[28px] px-4"
              style={{
                paddingTop: isCompact ? 24 : 32,
                paddingBottom: isCompact ? 20 : 36,
              }}
            >
              {/* Form content */}
              <View>
                {currentStep === 1 ? (
                  /* STEP 1: Personal Details */
                  <View key="personal-details">
                    <FormCardHeader
                      step={1}
                      totalSteps={4}
                      title="Personal Details"
                      subtitle="Enter your name for deliveries"
                    />

                    <FloatingInput
                      label="First name"
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />

                    <FloatingInput
                      label="Last name"
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />

                    <FloatingInput
                      label="Middle initial (optional)"
                      value={middleInitial}
                      onChangeText={setMiddleInitial}
                      maxLength={4}
                      autoCapitalize="characters"
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                  </View>
                ) : currentStep === 2 ? (
                  /* STEP 2: Account & Security */
                  <View key="account-security">
                    <FormCardHeader
                      step={2}
                      totalSteps={4}
                      title="Account & Security"
                      subtitle="Set up your login credentials and contact info"
                    />

                    <FloatingInput
                      label="Email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={(val) => {
                        setEmail(val);
                        if (emailError) setEmailError('');
                      }}
                      error={emailError}
                      returnKeyType="next"
                    />

                    <FloatingInput
                      label="Phone number"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                      returnKeyType="next"
                    />

                    <FloatingInput
                      label="Password"
                      value={password}
                      onChangeText={(val) => {
                        setPassword(val);
                        if (passwordError) setPasswordError('');
                      }}
                      secureTextEntry
                      error={passwordError}
                      returnKeyType="next"
                    />

                    <PasswordRequirements password={password} />

                    <FloatingInput
                      label="Confirm password"
                      value={confirmPassword}
                      onChangeText={(val) => {
                        setConfirmPassword(val);
                        if (confirmPasswordError) setConfirmPasswordError('');
                      }}
                      secureTextEntry
                      error={confirmPasswordError}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />

                    <Text
                      className="font-normal text-[#94a3b8] px-1"
                      style={{
                        fontSize: isCompact ? 10 : 11,
                        marginTop: 2,
                      }}
                    >
                      At least 8 characters with uppercase, lowercase, number & symbol.
                    </Text>
                  </View>
                ) : (
                  <View key="email-verification">
                    <FormCardHeader
                      step={3}
                      totalSteps={4}
                      title="Verify your email"
                      subtitle={<>Enter the 6-digit code for <Text className="font-bold text-[#1e293b]">{email.trim()}</Text>.</>}
                    />
                    <View className="mt-4 mb-4">
                      <VerificationCodeInput
                        autoFocus
                        value={verificationCode}
                        onChangeText={(value) => {
                          setVerificationCode(value);
                          setVerificationCodeError('');
                        }}
                        length={6}
                        onSubmit={handleVerifyCode}
                      />
                      {verificationCodeError ? <FieldError message={verificationCodeError} /> : null}
                    </View>
                  </View>
                )}
              </View>

              {/* Action buttons */}
              <View className="gap-3.5 mt-1">
                {currentStep === 1 ? (
                  <>
                    <AuthButton
                      label="Next"
                      variant="primary"
                      onPress={handleNextStep}
                      showArrow
                    />
                    <AuthButton
                      label="Back to login"
                      variant="secondary"
                      onPress={handleBackToLogin}
                    />
                  </>
                ) : currentStep === 2 ? (
                  <>
                    <AuthButton
                      label="Next"
                      variant="primary"
                      onPress={handleAccountNext}
                      isLoading={isLoading}
                      showArrow
                    />
                    <AuthButton
                      label="Back"
                      variant="secondary"
                      onPress={() => { Keyboard.dismiss(); setCurrentStep(1); }}
                    />
                  </>
                ) : (
                  <>
                    <AuthButton
                      label="Verify Code"
                      onPress={handleVerifyCode}
                      isLoading={isLoading}
                    />
                    <Text className="text-center text-[#64748b] text-xs">
                      Didn&apos;t receive a code?{' '}
                      <Text
                        accessibilityRole="button"
                        className={`font-bold ${resendSeconds > 0 || isResending ? 'text-[#94a3b8]' : 'text-[#2563eb]'}`}
                        onPress={handleResendCode}
                      >
                        {isResending
                          ? 'Sending...'
                          : resendSeconds > 0
                            ? `Resend in ${resendSeconds}s`
                            : 'Resend code'}
                      </Text>
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RegisterScreen;
