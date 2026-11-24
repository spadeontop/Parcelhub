import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
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
import { getPasswordRequirements, isValidEmail } from '../../utils/authValidation';

export const RegisterScreen: React.FC = () => {
  const { navigateTo } = useNavigationUi();
  const { showToast } = useToast();
  const { registerCustomer } = useAuthSession();

  const { height } = useWindowDimensions();
  const isCompact = height < 700;

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form states matching CustomerRegisterReq
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isRegistering = useRef(false);
  const latestEmail = useRef('');

  const handlePreviousStep = () => {
    if (isRegistering.current) return;
    Keyboard.dismiss();
    setCurrentStep(1);
  };

  const handleHelp = () => {
    if (isRegistering.current) return;
    Keyboard.dismiss();
    navigateTo('faq');
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

  const handleBackToLogin = () => {
    Keyboard.dismiss();
    setCurrentStep(1);
    setFirstName('');
    setLastName('');
    setMiddleInitial('');
    latestEmail.current = '';
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    navigateTo('login');
  };

  const handleRegister = async () => {
    if (isRegistering.current) return;
    Keyboard.dismiss();
    setPasswordError('');
    setConfirmPasswordError('');

    if (!isStep2Valid) {
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
      return;
    }

    const submittedEmail = email.trim();
    isRegistering.current = true;
    setIsLoading(true);
    try {
      await registerCustomer({
        email: submittedEmail,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleInitial: middleInitial.trim() || undefined,
        phoneNumber: phone.trim(),
      });
    } catch (err: any) {
      // Backend-authoritative error handling (Rule #9)
      const statusCode = err?.statusCode;
      const message = err?.message || 'Registration failed';
      const isConflict =
        statusCode === 409 ||
        err?.error === 'Conflict' ||
        message.toLowerCase().includes('already exists');

      if (isConflict && latestEmail.current.trim() === submittedEmail) {
        setEmailError(message);
      } else {
        showToast(message);
      }
    } finally {
      isRegistering.current = false;
      setIsLoading(false);
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
              subtitle={currentStep === 2 ? 'Almost there — secure your account' : undefined}
              onBack={currentStep === 2 ? handlePreviousStep : handleBackToLogin}
              onHelp={handleHelp}
            />

            {currentStep === 1 ? (
              <ScrollView
                className="flex-1 bg-white rounded-t-[28px]"
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  paddingTop: isCompact ? 24 : 32,
                  paddingBottom: isCompact ? 20 : 36,
                  gap: 16,
                }}
              >
                <View>
                  <FormCardHeader
                    step={1}
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
                <View className="gap-2.5">
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
                </View>
              </ScrollView>
            ) : (
              <View
                className="flex-1 bg-[#f8fafc] rounded-t-[28px] px-4 justify-between"
                style={{
                  paddingTop: isCompact ? 12 : 16,
                  paddingBottom: isCompact ? 16 : 24,
                }}
              >
                <View
                  className="bg-white rounded-2xl border border-[#e2e8f0]"
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: isCompact ? 12 : 16,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View>
                    <FormCardHeader
                      step={2}
                      title="Account & Security"
                      subtitle="Set up your login credentials and contact info"
                    />

                    <FloatingInput
                      label="Email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={(val) => {
                        latestEmail.current = val;
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
                </View>
                <View className="gap-2.5">
                  <AuthButton
                    label="Register"
                    variant="primary"
                    disableWhileLoading={false}
                    onPress={handleRegister}
                    isLoading={isLoading}
                  />
                  <AuthButton
                    label="Back"
                    variant="secondary"
                    onPress={handlePreviousStep}
                  />
                </View>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RegisterScreen;
