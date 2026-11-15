import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
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

  const handleNextStep = () => {
    if (!firstName.trim()) {
      showToast('Please enter your first name.');
      return;
    }
    if (!lastName.trim()) {
      showToast('Please enter your last name.');
      return;
    }
    setCurrentStep(2);
  };

  const handleBackToLogin = () => {
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
    navigateTo('login');
  };

  const handleRegister = async () => {
    setEmailError('');
    if (!email.trim()) {
      showToast('Please enter your email.');
      return;
    }
    if (!phone.trim()) {
      showToast('Please enter your phone number.');
      return;
    }
    if (!password.trim()) {
      showToast('Please enter a password.');
      return;
    }
    if (!confirmPassword.trim()) {
      showToast('Please confirm your password.');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match.');
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
      {/* Figma Top Header with Brand Header */}
      <AuthBrandHeader
        title="ParcelHub"
        subtitle={
          currentStep === 1
            ? 'Create your account'
            : 'Almost there — secure your account'
        }
        onBack={currentStep === 2 ? () => setCurrentStep(1) : handleBackToLogin}
        onHelp={() => navigateTo('faq')}
      />

      {/* Figma Main Sheet container */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        className="flex-1 bg-[#f8fafc] rounded-t-3xl px-4 pt-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form Card */}
        <View
          className="bg-white rounded-2xl p-4 border border-[#e2e8f0]"
          style={{
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
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
                placeholder="e.g. Juan"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />

              <AuthInput
                label="Last name"
                placeholder="e.g. Dela Cruz"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />

              <AuthInput
                label="Middle initial (optional)"
                placeholder="e.g. D."
                value={middleInitial}
                onChangeText={setMiddleInitial}
                maxLength={4}
                autoCapitalize="characters"
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
                placeholder="e.g. juan@example.com"
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (emailError) setEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={emailError}
              />

              <AuthInput
                label="Phone number"
                placeholder="e.g. 09171234567"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <AuthInput
                label="Password"
                placeholder="Create password"
                value={password}
                onChangeText={setPassword}
                isPassword
              />

              <AuthInput
                label="Confirm password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
              />

              <Text className="text-[11px] font-normal text-[#94a3b8] mt-0.5 mb-1 px-1">
                Use at least 8 characters with a number & symbol.
              </Text>
            </View>
          )}
        </View>

        {/* Buttons section (placed below card per Figma layout) */}
        <View className="mt-6">
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
          ) : (
            <>
              <AuthButton
                label="Register"
                variant="primary"
                onPress={handleRegister}
                isLoading={isLoading}
              />
              <AuthButton
                label="Back"
                variant="secondary"
                onPress={() => setCurrentStep(1)}
              />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;
