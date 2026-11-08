import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useApp } from '../../context/AppContext';
import { ParcelHubLogoSvg, EyeIcon, EyeOffIcon } from '../common/Icons';

export const RegisterScreen: React.FC = () => {
  const { navigateTo, registerCustomer, showToast } = useApp();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form states matching CustomerRegisterRequest
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

    // Check duplicate email using backend error contract as basis (ApiErrorResponse / 409 Conflict):
    // Seeded accounts like user@example.com return "Customer with this email already exists"
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
      // Basis from backend/app/types/api.ts (ApiErrorResponse: statusCode 409, error "Conflict", message "Customer with this email already exists")
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
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      className="flex-1 bg-white px-6 py-8"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Centered Logo */}
      <View className="items-center justify-center mb-2 mt-1">
        <ParcelHubLogoSvg size={58} />
        <View className="flex-row items-center mt-2">
          <Text className="text-[20px] font-extrabold tracking-tight leading-none text-[#215cd4]">
            Parcel
          </Text>
          <Text className="text-[20px] font-extrabold tracking-tight leading-none text-[#111827]">
            Hub
          </Text>
        </View>
      </View>

      {/* Screen Subtitle */}
      <Text className="text-[17px] font-semibold text-gray-700 text-center mb-4">
        Register
      </Text>

      {/* Minimal Stepper Bar Header */}
      <View className="flex-row items-center justify-between mb-4 px-1">
        <View className="bg-[#e8eefb] px-2.5 py-1 rounded-full">
          <Text className="text-[11.5px] font-bold text-[#215cd4]">
            Step {currentStep} of 2
          </Text>
        </View>
        <View className="flex-row gap-1.5 w-20 h-1">
          <View className="flex-1 rounded-full bg-[#215cd4]" />
          <View
            className={`flex-1 rounded-full ${
              currentStep === 2 ? 'bg-[#215cd4]' : 'bg-gray-200'
            }`}
          />
        </View>
      </View>

      {currentStep === 1 ? (
        /* STEP 1: Personal */
        <View className="gap-3.5">
          {/* First Name */}
          <View className="relative mb-3.5">
            <View className="absolute -top-2 left-3 bg-white px-1.5 z-10">
              <Text className="text-[11px] font-semibold text-gray-600 tracking-tight">
                First name
              </Text>
            </View>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="e.g. Juan"
              placeholderTextColor="#9ca3af"
              className="w-full h-11 border border-gray-300 rounded-lg px-3.5 text-[13.5px] font-medium text-gray-900 bg-white"
            />
          </View>

          {/* Last Name */}
          <View className="relative mb-3.5">
            <View className="absolute -top-2 left-3 bg-white px-1.5 z-10">
              <Text className="text-[11px] font-semibold text-gray-600 tracking-tight">
                Last name
              </Text>
            </View>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="e.g. Dela Cruz"
              placeholderTextColor="#9ca3af"
              className="w-full h-11 border border-gray-300 rounded-lg px-3.5 text-[13.5px] font-medium text-gray-900 bg-white"
            />
          </View>

          {/* Middle Initial (Optional) */}
          <View className="relative mb-3.5">
            <View className="absolute -top-2 left-3 bg-white px-1.5 z-10">
              <Text className="text-[11px] font-semibold text-gray-600 tracking-tight">
                Middle initial (optional)
              </Text>
            </View>
            <TextInput
              value={middleInitial}
              onChangeText={setMiddleInitial}
              maxLength={4}
              placeholder="e.g. D."
              placeholderTextColor="#9ca3af"
              className="w-full h-11 border border-gray-300 rounded-lg px-3.5 text-[13.5px] font-medium text-gray-900 bg-white"
            />
          </View>

          {/* Primary Action Button: Next */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleNextStep}
            className="w-full h-11 bg-[#215cd4] rounded-lg items-center justify-center mt-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Text className="text-white font-semibold text-[14.5px]">Next</Text>
          </TouchableOpacity>

          {/* Secondary Action: Back to login */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigateTo('login')}
            className="w-full h-10 bg-[#e8eefb] rounded-lg items-center justify-center mt-2.5"
          >
            <Text className="text-[#1e3a8a] font-semibold text-[13px]">Back to login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* STEP 2: Account */
        <View className="gap-3.5">
          {/* Email */}
          <View className="relative mb-3.5">
            <View className="absolute -top-2 left-3 bg-white px-1.5 z-10">
              <Text
                className={`text-[11px] font-semibold tracking-tight ${
                  emailError ? 'text-red-500' : 'text-gray-600'
                }`}
              >
                Email
              </Text>
            </View>
            <TextInput
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (emailError) setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="e.g. juan@example.com"
              placeholderTextColor="#9ca3af"
              className={`w-full h-11 border rounded-lg px-3.5 text-[13.5px] font-medium text-gray-900 bg-white ${
                emailError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {emailError ? (
              <Text className="text-[11.5px] font-medium text-red-500 mt-1.5 ml-1">
                {emailError}
              </Text>
            ) : null}
          </View>

          {/* Phone Number */}
          <View className="relative mb-3.5">
            <View className="absolute -top-2 left-3 bg-white px-1.5 z-10">
              <Text className="text-[11px] font-semibold text-gray-600 tracking-tight">
                Phone number
              </Text>
            </View>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="e.g. 09171234567"
              placeholderTextColor="#9ca3af"
              className="w-full h-11 border border-gray-300 rounded-lg px-3.5 text-[13.5px] font-medium text-gray-900 bg-white"
            />
          </View>

          {/* Password */}
          <View className="relative mb-3.5">
            <View className="absolute -top-2 left-3 bg-white px-1.5 z-10">
              <Text className="text-[11px] font-semibold text-gray-600 tracking-tight">
                Password
              </Text>
            </View>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Create password"
              placeholderTextColor="#9ca3af"
              className="w-full h-11 border border-gray-300 rounded-lg pl-3.5 pr-10 text-[13.5px] font-medium text-gray-900 bg-white"
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-2 p-1.5 z-20"
              style={{ zIndex: 20 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOffIcon size={18} color="#6b7280" />
              ) : (
                <EyeIcon size={18} color="#6b7280" />
              )}
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View className="relative mb-3.5">
            <View className="absolute -top-2 left-3 bg-white px-1.5 z-10">
              <Text className="text-[11px] font-semibold text-gray-600 tracking-tight">
                Confirm password
              </Text>
            </View>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              placeholder="Confirm password"
              placeholderTextColor="#9ca3af"
              className="w-full h-11 border border-gray-300 rounded-lg pl-3.5 pr-10 text-[13.5px] font-medium text-gray-900 bg-white"
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-2 top-2 p-1.5 z-20"
              style={{ zIndex: 20 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? (
                <EyeOffIcon size={18} color="#6b7280" />
              ) : (
                <EyeIcon size={18} color="#6b7280" />
              )}
            </TouchableOpacity>
          </View>

          {/* Primary Action Button: Register */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleRegister}
            disabled={isLoading}
            className={`w-full h-11 bg-[#215cd4] rounded-lg items-center justify-center mt-4 ${
              isLoading ? 'opacity-60' : ''
            }`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-white font-semibold text-[14.5px]">Register</Text>
            )}
          </TouchableOpacity>

          {/* Secondary Action: Back */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCurrentStep(1)}
            className="w-full h-10 bg-[#e8eefb] rounded-lg items-center justify-center mt-2.5"
          >
            <Text className="text-[#1e3a8a] font-semibold text-[13px]">Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

export default RegisterScreen;
