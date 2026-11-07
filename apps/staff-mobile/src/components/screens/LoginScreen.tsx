import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useStaff } from '../../context/StaffContext';
import { ShieldCheck, AlertCircle, ArrowRight } from '../common/Icons';
import { ENV } from '../../config/env';

export const LoginScreen: React.FC = () => {
  const { login } = useStaff();
  const [email, setEmail] = useState<string>(ENV.DEFAULT_STAFF_EMAIL);
  const [password, setPassword] = useState<string>(ENV.DEFAULT_STAFF_PASSWORD);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (eEmail = email, ePass = password) => {
    if (!eEmail.trim() || !ePass.trim() || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(eEmail.trim(), ePass.trim());
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed. Please check credentials or backend status.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    setEmail(ENV.DEFAULT_STAFF_EMAIL);
    setPassword(ENV.DEFAULT_STAFF_PASSWORD);
    handleLogin(ENV.DEFAULT_STAFF_EMAIL, ENV.DEFAULT_STAFF_PASSWORD);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-[#F8FAFC] justify-center px-5"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View className="max-w-md w-full mx-auto">
          {/* Header Banner */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 rounded-2xl bg-[#215CD4] items-center justify-center mb-3 shadow-md">
              <ShieldCheck size={32} color="#FFFFFF" />
            </View>
            <Text className="text-[11px] font-bold tracking-widest text-[#215CD4] uppercase">
              INVENTORY & ASSETS
            </Text>
            <Text className="text-2xl font-black text-[#0F172A] tracking-tight mt-0.5">
              Parcelhub Staff Terminal
            </Text>
            <Text className="text-xs text-[#64748B] mt-1 font-medium">
              Authorized Front Desk Personnel Only
            </Text>
          </View>

          {/* Login Card */}
          <View className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4">
            <Text className="text-base font-bold text-[#0F172A] mb-1">
              Sign In to Terminal
            </Text>

            {/* Error Banner */}
            {errorMessage && (
              <View className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex-row items-start gap-2">
                <AlertCircle size={16} color="#e11d48" className="mt-0.5 shrink-0" />
                <Text className="text-rose-700 text-xs flex-1 leading-relaxed">
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Email Field */}
            <View className="space-y-1.5">
              <Text className="text-xs font-semibold text-[#64748B]">Staff Email</Text>
              <View className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-3">
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="staff@parcelhub.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="text-sm text-[#0F172A]"
                />
              </View>
            </View>

            {/* Password Field */}
            <View className="space-y-1.5">
              <Text className="text-xs font-semibold text-[#64748B]">Password</Text>
              <View className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-3">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  autoCapitalize="none"
                  className="text-sm text-[#0F172A]"
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={() => handleLogin()}
              disabled={isLoading}
              className="bg-[#215CD4] active:bg-[#1d4ed8] py-3.5 rounded-xl flex-row items-center justify-center gap-2 mt-2 shadow-sm"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text className="text-white font-bold text-sm">
                    Enter Terminal
                  </Text>
                  <ArrowRight size={16} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>

            {/* Demo One-Click Login */}
            <TouchableOpacity
              onPress={handleQuickDemoLogin}
              disabled={isLoading}
              className="bg-[#F1F5F9] border border-[#E2E8F0] active:bg-slate-200 py-3 rounded-xl items-center justify-center mt-1"
            >
              <Text className="text-xs font-semibold text-[#475569]">
                Quick Demo Sign-In ({ENV.DEFAULT_STAFF_EMAIL})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
