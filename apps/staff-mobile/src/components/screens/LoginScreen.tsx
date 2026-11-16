import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useStaff } from '../../context/StaffContext';
import { AlertCircle } from '../common/Icons';
import { ENV } from '../../config/env';
import {
  LoginHeader,
  LoginInput,
  LoginButton,
  ForgotPasswordModal,
} from '../auth';

export const LoginScreen: React.FC = () => {
  const { login } = useStaff();
  const [email, setEmail] = useState<string>(ENV.DEFAULT_STAFF_EMAIL);
  const [password, setPassword] = useState<string>(ENV.DEFAULT_STAFF_PASSWORD);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal dialog states
  const [isForgotPassOpen, setIsForgotPassOpen] = useState<boolean>(false);

  const handleLogin = async (eEmail = email, ePass = password) => {
    if (!eEmail.trim() || !ePass.trim() || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(eEmail.trim(), ePass.trim());
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Login failed. Please check credentials or backend status.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Header Section (Dark theme with Branding) */}
          <LoginHeader
            title="ParcelHub"
            subtitle="Staff Mobile Portal"
          />

          {/* Main Sheet (Figma Login_MainSheet with White Rounded Top) */}
          <View
            style={{ borderTopLeftRadius: 36, borderTopRightRadius: 36 }}
            className="flex-1 bg-white px-6 pt-7 pb-10 shadow-lg"
          >
            {/* Narration Header */}
            <View className="mb-5">
              <Text className="text-[20px] font-bold text-[#1E293B] tracking-tight">
                Welcome!
              </Text>
              <Text className="text-[12px] font-normal text-[#64748B] mt-1.5 leading-[18px]">
                Sign in to track deliveries, manage hub{'\n'}pickups, and cater customers.
              </Text>
              <View className="h-[1px] bg-slate-100 mt-4 w-full" />
            </View>

            {/* Error Banner */}
            {errorMessage && (
              <View className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex-row items-start gap-2 mb-4">
                <AlertCircle size={16} color="#e11d48" className="mt-0.5 shrink-0" />
                <Text className="text-rose-700 text-xs flex-1 leading-relaxed">
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Form Card with explicit spacing on mobile */}
            <View>
              {/* Username Input */}
              <LoginInput
                label="Username"
                placeholder="Enter username"
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoCapitalize="none"
                returnKeyType="next"
                containerStyle={{ marginBottom: 14 }}
              />

              {/* Password Input */}
              <LoginInput
                label="Password"
                placeholder="Enter password"
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                isPassword
                returnKeyType="done"
                onSubmitEditing={() => handleLogin()}
                containerStyle={{ marginBottom: 6 }}
              />

              {/* Utility Row (Forgot password link) */}
              <View className="flex-row items-center pt-1 pb-1">
                <TouchableOpacity
                  onPress={() => setIsForgotPassOpen(true)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text className="text-[12px] font-bold text-[#2563EB]">
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Primary Sign In Button */}
              <View className="pt-2">
                <LoginButton
                  title="Sign In"
                  onPress={() => handleLogin()}
                  isLoading={isLoading}
                  disabled={isLoading || !email.trim() || !password.trim()}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Reusable Modals */}
      <ForgotPasswordModal
        isOpen={isForgotPassOpen}
        onClose={() => setIsForgotPassOpen(false)}
      />
    </View>
  );
};
