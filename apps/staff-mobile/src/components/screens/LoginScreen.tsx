import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useStaff } from '../../context/StaffContext';
import { ShieldCheck, LogOut, AlertCircle, ArrowRight } from '../common/Icons';
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
      className="flex-1 bg-slate-950 justify-center px-4"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        <View className="max-w-md w-full mx-auto">
          {/* Logo / Badge */}
          <View className="items-center mb-6">
            <View className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/30 items-center justify-center mb-3 shadow-lg">
              <ShieldCheck size={32} color="#60a5fa" />
            </View>
            <Text className="text-white text-2xl font-black tracking-tight text-center">
              PARCELHUB
            </Text>
            <View className="flex-row items-center gap-1.5 mt-1 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
              <View className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <Text className="text-blue-300 text-[11px] font-semibold tracking-wider uppercase">
                Staff Counter Terminal
              </Text>
            </View>
          </View>

          {/* Login Card */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <Text className="text-white font-bold text-base mb-1">
              Counter Sign In
            </Text>

            {/* Error Banner */}
            {errorMessage && (
              <View className="bg-rose-950/50 border border-rose-800/60 rounded-xl p-3 flex-row items-start gap-2">
                <AlertCircle size={16} color="#f43f5e" className="mt-0.5 shrink-0" />
                <Text className="text-rose-300 text-xs flex-1 leading-relaxed">
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Email Field */}
            <View className="space-y-1.5">
              <Text className="text-slate-400 text-xs font-semibold">Staff Email</Text>
              <View className="bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5">
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="staff@parcelhub.com"
                  placeholderTextColor="#64748b"
                  className="text-white text-xs font-medium py-0.5"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Field */}
            <View className="space-y-1.5">
              <Text className="text-slate-400 text-xs font-semibold">Terminal Password</Text>
              <View className="bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                  secureTextEntry
                  className="text-white text-xs font-medium py-0.5"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Login Submit Button */}
            <TouchableOpacity
              onPress={() => handleLogin()}
              disabled={isLoading}
              className="bg-blue-600 active:bg-blue-700 py-3.5 rounded-xl flex-row items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text className="text-white font-bold text-xs uppercase tracking-wider">
                    Sign In to Terminal
                  </Text>
                  <ArrowRight size={15} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>

            {/* Quick Demo Login Shortcut */}
            <View className="pt-2 border-t border-slate-800">
              <TouchableOpacity
                onPress={handleQuickDemoLogin}
                disabled={isLoading}
                className="bg-slate-800/80 active:bg-slate-700/80 border border-slate-700 py-2.5 rounded-xl flex-row items-center justify-center gap-2"
              >
                <Text className="text-blue-400 font-semibold text-xs">
                  ⚡ 1-Tap Quick Demo Staff Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Info */}
          <View className="items-center mt-6">
            <Text className="text-[11px] text-slate-400">Connected Endpoint: {ENV.API_BASE_URL}</Text>
            <Text className="text-[10px] text-slate-400 mt-0.5">Counter Station Desk #01 • ParcelHub POS</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
