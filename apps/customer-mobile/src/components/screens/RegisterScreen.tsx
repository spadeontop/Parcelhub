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
import { useApp } from '../../context/AppContext';
import { AuthBrandHeader } from '../layout/AuthBrandHeader';
import { FormCardHeader } from '../common/FormCardHeader';
import { AuthInput } from '../common/AuthInput';
import { AuthButton } from '../common/AuthButton';
import {
  getRetainedRegistrationData,
  setRetainedRegistrationData,
  clearRetainedRegistrationData,
} from '../../services/registrationState';

export const RegisterScreen: React.FC = () => {
  const { navigateTo, registerCustomer, clearPendingRegistration, showToast } = useApp();
  const { height } = useWindowDimensions();
  const isCompact = height < 700;

  const retained = getRetainedRegistrationData();
  const [currentStep, setCurrentStep] = useState<1 | 2>(retained.currentStep);

  // Form states matching CustomerRegisterRequest - initialized from retained data
  const [firstName, setFirstName] = useState(retained.firstName);
  const [lastName, setLastName] = useState(retained.lastName);
  const [middleInitial, setMiddleInitial] = useState(retained.middleInitial);
  const [email, setEmail] = useState(retained.email);
  const [phone, setPhone] = useState(retained.phone);
  const [password, setPassword] = useState(retained.password);
  const [confirmPassword, setConfirmPassword] = useState(retained.confirmPassword);
  const [emailError, setEmailError] = useState(retained.emailError || '');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Retain inputted data and current step
  useEffect(() => {
    setRetainedRegistrationData({
      currentStep,
      firstName,
      lastName,
      middleInitial,
      email,
      phone,
      password,
      confirmPassword,
      emailError,
    });
  }, [currentStep, firstName, lastName, middleInitial, email, phone, password, confirmPassword, emailError]);

  // Validation rules for Step 1
  const isFirstNameValid = firstName.trim().length >= 1;
  const isLastNameValid = lastName.trim().length >= 1;
  const isStep1Valid = isFirstNameValid && isLastNameValid;

  // Validation rules for Step 2
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email.trim());
  const isPhoneValid = (() => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return /^(\+63|0)?9\d{9}$/.test(cleaned) || (cleaned.length >= 10 && /^\+?\d+$/.test(cleaned));
  })();
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>_\-]/.test(password);
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
    clearRetainedRegistrationData();
    clearPendingRegistration();
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

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === 'user@example.com' || normalizedEmail === 'staff@parcelhub.com') {
      setEmailError('Customer with this email already exists');
      return;
    }

    setIsLoading(true);
    try {
      await registerCustomer({
        password,
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleInitial: middleInitial.trim() || undefined,
        phoneNumber: phone.trim(),
      });
    } catch (err: any) {
      const isDuplicate =
        err?.statusCode === 409 ||
        err?.error === 'Conflict' ||
        (err?.message && (
          err.message.toLowerCase().includes('already exists') ||
          err.message.toLowerCase().includes('duplicate') ||
          err.message.toLowerCase().includes('already registered') ||
          err.message.toLowerCase().includes('conflict')
        ));

      if (isDuplicate) {
        setEmailError(err?.message || 'Customer with this email already exists');
      } else {
        showToast(err?.message || 'Registration failed. Please check your information.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
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

          {/* Main non-scrollable sheet */}
          <View
            className="flex-1 bg-[#f8fafc] rounded-t-3xl px-4 justify-between"
            style={{
              paddingTop: isCompact ? 12 : 16,
              paddingBottom: isCompact ? 16 : 24,
            }}
          >
            {/* Top/Middle Area: Form Card */}
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
              {currentStep === 1 ? (
                /* STEP 1: Personal Details */
                <View>
                  <FormCardHeader
                    step={1}
                    title="Personal Details"
                    subtitle="Enter your name for deliveries"
                  />

                  <AuthInput
                    label="First name"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    isValid={isFirstNameValid}
                  />

                  <AuthInput
                    label="Last name"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    isValid={isLastNameValid}
                  />

                  <AuthInput
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

                  <AuthInput
                    label="Email"
                    type="email"
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (emailError) setEmailError('');
                    }}
                    error={emailError}
                    returnKeyType="next"
                  />

                  <AuthInput
                    label="Phone number"
                    type="phone"
                    value={phone}
                    onChangeText={setPhone}
                    returnKeyType="next"
                  />

                  <AuthInput
                    label="Password"
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (passwordError) setPasswordError('');
                    }}
                    isPassword
                    isValid={isPasswordValid}
                    error={passwordError}
                    returnKeyType="next"
                  />

                  <AuthInput
                    label="Confirm password"
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      if (confirmPasswordError) setConfirmPasswordError('');
                    }}
                    isPassword
                    isValid={isConfirmPasswordValid}
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

            {/* Bottom Pinned Action Buttons */}
            <View className="gap-2.5">
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
                    onPress={() => { Keyboard.dismiss(); setCurrentStep(1); }}
                  />
                </>
              )}
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;
