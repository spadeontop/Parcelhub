import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useApp } from '../../context/AppContext';
import { ParcelHubLogoSvg } from '../common/Icons';

export const LoginScreen: React.FC = () => {
  const { navigateTo, loginCustomer, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      showToast('Please enter your email.');
      return;
    }
    if (!password.trim()) {
      showToast('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await loginCustomer({ email: email.trim(), password });
    } catch (err: any) {
      showToast(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestCredentials = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    showToast(`Filled credentials for ${e}`);
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      className="flex-1 bg-white px-6 py-8"
      showsVerticalScrollIndicator={false}
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
          <Text className="text-xs font-bold text-gray-600 mb-1">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Enter email address"
            className="w-full h-12 border border-gray-300 rounded-xl px-3.5 text-sm font-medium text-gray-900 bg-white"
          />
        </View>

        <View>
          <Text className="text-xs font-bold text-gray-600 mb-1">Password</Text>
          <View className="relative justify-center">
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Enter password"
              className="w-full h-12 border border-gray-300 rounded-xl px-3.5 pr-12 text-sm font-medium text-gray-900 bg-white"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-3 p-1.5"
            >
              <Text className="text-xs font-bold text-gray-500">
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>
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
          <TouchableOpacity onPress={() => navigateTo('register')}>
            <Text className="text-xs font-bold text-[#215cd4]">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};
