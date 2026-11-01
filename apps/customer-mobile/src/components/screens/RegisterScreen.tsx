import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useApp } from '../../context/AppContext';
import { ParcelHubLogoSvg } from '../common/Icons';

export const RegisterScreen: React.FC = () => {
  const { navigateTo, registerCustomer, showToast } = useApp();
  const [firstname, setFirstname] = useState('John Vince');
  const [middleinitial, setMiddleinitial] = useState('K');
  const [lastname, setLastname] = useState('Dumaguit');
  const [email, setEmail] = useState('johnvincekeyedu@gmail.com');
  const [phonenumber, setPhonenumber] = useState('0917 123 4567');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!firstname.trim() || !lastname.trim()) {
      showToast('Please provide your complete name.');
      return;
    }
    if (!email.trim() || !password.trim()) {
      showToast('Please provide email and password.');
      return;
    }
    if (!phonenumber.trim()) {
      showToast('Please provide your phone number.');
      return;
    }

    setIsLoading(true);
    try {
      await registerCustomer({
        firstname: firstname.trim(),
        middleinitial: middleinitial.trim(),
        lastname: lastname.trim(),
        email: email.trim(),
        phonenumber: phonenumber.trim(),
        password,
      });
    } catch (err: any) {
      showToast(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      className="flex-1 bg-white px-6 py-8"
      showsVerticalScrollIndicator={false}
    >
      <View className="items-center justify-center mb-5">
        <ParcelHubLogoSvg size={52} />
        <Text className="text-xl font-black text-gray-900 mt-2">
          Create Account
        </Text>
        <Text className="text-xs text-gray-400 mt-0.5">
          Join ParcelHub Customer Terminal
        </Text>
      </View>

      <View className="space-y-3">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Text className="text-xs font-bold text-gray-600 mb-1">First Name</Text>
            <TextInput
              value={firstname}
              onChangeText={setFirstname}
              placeholder="First name"
              className="h-11 border border-gray-300 rounded-xl px-3 text-xs font-medium text-gray-900 bg-white"
            />
          </View>

          <View className="w-16">
            <Text className="text-xs font-bold text-gray-600 mb-1">M.I.</Text>
            <TextInput
              value={middleinitial}
              onChangeText={setMiddleinitial}
              maxLength={2}
              placeholder="M.I."
              className="h-11 border border-gray-300 rounded-xl px-2 text-center text-xs font-medium text-gray-900 bg-white"
            />
          </View>
        </View>

        <View>
          <Text className="text-xs font-bold text-gray-600 mb-1">Last Name</Text>
          <TextInput
            value={lastname}
            onChangeText={setLastname}
            placeholder="Last name"
            className="h-11 border border-gray-300 rounded-xl px-3 text-xs font-medium text-gray-900 bg-white"
          />
        </View>

        <View>
          <Text className="text-xs font-bold text-gray-600 mb-1">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="name@example.com"
            className="h-11 border border-gray-300 rounded-xl px-3 text-xs font-medium text-gray-900 bg-white"
          />
        </View>

        <View>
          <Text className="text-xs font-bold text-gray-600 mb-1">Phone Number</Text>
          <TextInput
            value={phonenumber}
            onChangeText={setPhonenumber}
            keyboardType="phone-pad"
            placeholder="0917 123 4567"
            className="h-11 border border-gray-300 rounded-xl px-3 text-xs font-medium text-gray-900 bg-white"
          />
        </View>

        <View>
          <Text className="text-xs font-bold text-gray-600 mb-1">Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter password"
            className="h-11 border border-gray-300 rounded-xl px-3 text-xs font-medium text-gray-900 bg-white"
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={isLoading}
          className="w-full mt-4 h-12 rounded-xl bg-[#215cd4] items-center justify-center shadow-md"
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-bold text-sm tracking-wide">
              Continue to MPIN Setup
            </Text>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center justify-center mt-3">
          <Text className="text-xs text-gray-500">Already registered? </Text>
          <TouchableOpacity onPress={() => navigateTo('login')}>
            <Text className="text-xs font-bold text-[#215cd4]">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

