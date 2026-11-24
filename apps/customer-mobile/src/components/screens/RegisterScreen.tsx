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
    Keyboard.dismiss();
    setEmailError('');
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

    setIsLoading(true);
    try {
      await registerCustomer({
        email: email.trim(),
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

      if (isConflict) {
        setEmailError(message);
      } else {
        showToast(message);
      }
    } finally {
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
              title="ParcelHub"
              subtitle={
                currentStep === 1
                  ? 'Create your account'
                  : 'Almost there — secure your account'
              }
              onBack={currentStep === 2 ? () => { Keyboard.dismiss(); setCurrentStep(1); } : handleBackToLogin}
              onHelp={() => { Keyboard.dismiss(); navigateTo('faq'); }}
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
                ) : (
                  /* STEP 2: Account & Security */
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
                )}
              </View>

              {/* Action buttons */}
              <View className="gap-3.5 mt-1">
                {currentStep === 1 ? (
                  <>
                    <AuthButton
                      label="Next"
                      variant="primary"
                      disabled={!isStep1Valid}
                      onPress={handleNextStep}
                      showArrow
                    />
                    <AuthButton
                      label="Back to login"
                      variant="secondary"
                      onPress={handleBackToLogin}
                    />
                  </>
                ) : (
                  <>
                    <AuthButton
                      label="Register"
                      variant="primary"
                      disabled={!isStep2Valid || isLoading}
                      onPress={handleRegister}
                      isLoading={isLoading}
                    />
                    <AuthButton
                      label="Back"
                      variant="secondary"
                      onPress={() => {
                        Keyboard.dismiss();
                        setCurrentStep(1);
                      }}
                    />
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
