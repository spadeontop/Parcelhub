import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useApp } from '../../context/AppContext';
import { ParcelHubLogoSvg } from '../common/Icons';
import { PasswordEyeToggle } from '../common/PasswordEyeToggle';
import { clearRetainedRegistrationData } from '../../services/registrationState';

export const LoginScreen: React.FC = () => {
  const { navigateTo, loginCustomer, clearPendingRegistration, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setEmailError('');
    setPasswordError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Please enter your email.');
      showToast('Please enter your email.');
      return;
    }
    if (!password) {
      setPasswordError('Please enter your password.');
      showToast('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await loginCustomer({ email: trimmedEmail, password });
    } catch (err: any) {
      // Basis from backend/app/types/api.ts (ApiErrorResponse: statusCode 404/401, error "Not Found"/"Unauthorized")
      const status = err?.statusCode;
      const errorType = err?.error;
      const rawMessage = err?.message || '';
      const msg = rawMessage.toLowerCase();

      const isUnregisteredEmail =
        status === 404 ||
        errorType === 'Not Found' ||
        msg.includes('not registered') ||
        msg.includes('unregistered') ||
        msg.includes('does not exist') ||
        msg.includes('no account') ||
        msg.includes('email not found') ||
        msg.includes('user not found');

      const isWrongPassword =
        msg.includes('incorrect password') ||
        msg.includes('wrong password') ||
        msg.includes('invalid password') ||
        (status === 401 && !isUnregisteredEmail && !msg.includes('email'));

      if (isUnregisteredEmail) {
        setEmailError(
          rawMessage.includes('registered') || rawMessage.includes('found')
            ? rawMessage
            : 'Email is not registered'
        );
      } else if (isWrongPassword) {
        setPasswordError(
          rawMessage.includes('password') || rawMessage.includes('incorrect')
            ? rawMessage
            : 'Incorrect password'
        );
      } else {
        showToast(rawMessage || 'Login failed. Please check your credentials.');
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
      {/* Centered Large Official Logo */}
      <View className="items-center justify-center mb-6">
        <ParcelHubLogoSvg size={76} />
        <View className="flex-row items-center mt-2">
          <Text className="text-2xl font-black tracking-tight text-[#215cd4]">
            Parcel
          </Text>
          <Text className="text-2xl font-black tracking-tight text-[#111827]">
            Hub
          </Text>
        </View>
        <Text className="text-xs text-gray-400 mt-1">Customer Mobile Portal</Text>
      </View>

      {/* Form with Inputs */}
      <View className="space-y-4">
        <View>
          <Text
            className={`text-xs font-bold mb-1 ${
              emailError ? 'text-red-500' : 'text-gray-600'
            }`}
          >
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={(val) => {
              setEmail(val);
              if (emailError) setEmailError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Enter email address"
            placeholderTextColor="#9ca3af"
            className={`w-full h-12 border rounded-xl px-3.5 text-sm font-medium text-gray-900 bg-white ${
              emailError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {emailError ? (
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              className="text-[11.5px] font-medium text-red-500 mt-1.5 ml-1"
            >
              {emailError}
            </Text>
          ) : null}
        </View>

        <View>
          <Text
            className={`text-xs font-bold mb-1 ${
              passwordError ? 'text-red-500' : 'text-gray-600'
            }`}
          >
            Password
          </Text>
          <View className="relative justify-center">
            <TextInput
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                if (passwordError) setPasswordError('');
              }}
              secureTextEntry={!showPassword}
              placeholder="Enter password"
              placeholderTextColor="#9ca3af"
              className={`w-full h-12 border rounded-xl px-3.5 pr-12 text-sm font-medium text-gray-900 bg-white ${
                passwordError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <PasswordEyeToggle
              isVisible={showPassword}
              onToggle={() => setShowPassword((prev) => !prev)}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2.5 top-0 bottom-0 justify-center z-20"
            />
          </View>
          {passwordError ? (
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              className="text-[11.5px] font-medium text-red-500 mt-1.5 ml-1"
            >
              {passwordError}
            </Text>
          ) : null}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={isLoading}
          className="w-full mt-3 h-12 rounded-xl bg-[#215cd4] items-center justify-center shadow-md"
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-bold text-sm tracking-wide">
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center justify-center mt-4">
          <Text className="text-xs text-gray-500">Don’t have an account? </Text>
          <TouchableOpacity
            onPress={() => {
              clearRetainedRegistrationData();
              clearPendingRegistration();
              navigateTo('register');
            }}
          >
            <Text className="text-xs font-bold text-[#215cd4]">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};
