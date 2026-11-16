import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useV1 } from '../../v1/context/V1Context';
import { AuthBrandHeader } from '../layout/AuthBrandHeader';
import { LoginNarrationHeader } from '../common/LoginNarrationHeader';
import { AuthInput } from '../common/AuthInput';
import { AuthButton } from '../common/AuthButton';

export const LoginScreen: React.FC = () => {
  const { navigateTo, loginCustomer, clearRegistrationDraft, showToast } = useV1();
  const { height } = useWindowDimensions();
  const isCompact = height < 700;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setEmailError('');
    setPasswordError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Please enter your email.');
      return;
    }
    if (!password) {
      setPasswordError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await loginCustomer({ email: trimmedEmail, password });
      // Clear password from state upon successful login
      setPassword('');
    } catch (err: any) {
      const rawMessage = err?.message || 'Login failed. Please check your credentials.';
      const status = err?.statusCode;
      const errorType = err?.error;
      const msg = rawMessage.toLowerCase();

      // Backend-authoritative error handling (Rule #9)
      if (status === 404 || errorType === 'Not Found' || msg.includes('not registered')) {
        setEmailError(rawMessage);
      } else if (status === 401 || errorType === 'Unauthorized' || msg.includes('password')) {
        setPasswordError(rawMessage);
      } else {
        showToast(rawMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToRegister = () => {
    Keyboard.dismiss();
    clearRegistrationDraft();
    navigateTo('register');
  };

  const handleForgotPassword = () => {
    Keyboard.dismiss();
    showToast('Please contact your branch administrator to reset your credentials.');
  };

  return (
    <View className="flex-1 bg-[#2563eb]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-[#2563eb]"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View className="flex-1 bg-[#2563eb]">
            {/* Top Brand Header */}
            <AuthBrandHeader
              title="ParcelHub"
              subtitle="Customer Mobile Portal"
            />

            {/* Main White Sheet with curved top transition */}
            <View
              className="flex-1 bg-white rounded-t-[28px] px-4"
              style={{
                paddingTop: isCompact ? 24 : 32,
                paddingBottom: isCompact ? 20 : 36,
              }}
            >
              {/* Form Content Area */}
              <View>
                {/* Login Narration Header */}
                <View className="px-1.5">
                  <LoginNarrationHeader
                    title="Welcome!"
                    subtitle={'Sign in to track deliveries, manage hub\npickups, and view your QR passes.'}
                  />
                </View>

                {/* Input Fields */}
                <View>
                  {/* Email Input */}
                  <AuthInput
                    label="Email"
                    type="email"
                    showSuccessCheck={false}
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (emailError) setEmailError('');
                    }}
                    error={emailError}
                    returnKeyType="next"
                  />

                  {/* Password Input */}
                  <AuthInput
                    label="Password"
                    type="password"
                    showSuccessCheck={false}
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (passwordError) setPasswordError('');
                    }}
                    error={passwordError}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />

                  {/* Utility Row: Forgot Password (right-aligned in Figma: right: 8.97%) */}
                  <View className="items-end mt-1 mb-5 px-1">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleForgotPassword}
                      className="py-1"
                    >
                      <Text className="text-[12px] font-bold text-[#2563eb]">
                        Forgot password?
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Actions Area: Sign In Button & Sign Up link placed directly below the input fields */}
                <View className="gap-3.5 mt-1">
                  <AuthButton
                    label="Sign In"
                    variant="primary"
                    disabled={isLoading}
                    onPress={handleSubmit}
                    isLoading={isLoading}
                  />

                  {/* Don't have an account? Sign Up row */}
                  <View className="flex-row items-center justify-center py-1">
                    <Text className="text-[13px] font-normal text-[#64748b]">
                      Don't have an account?{' '}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleNavigateToRegister}
                      className="py-1"
                    >
                      <Text className="text-[13px] font-bold text-[#2563eb]">
                        Sign Up
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;
