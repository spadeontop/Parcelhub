import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../layout/BottomNav';
import { BackButton } from '../common/BackButton';
import { EditContactModal } from '../modals/EditContactModal';
import { ChangePasswordModal } from '../modals/ChangePasswordModal';
import { DeleteAccountModal } from '../modals/DeleteAccountModal';
import { SignOutModal } from '../modals/SignOutModal';

// Masking helpers
function getMaskedEmail(email?: string): string {
  if (!email) return '—';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [user, domain] = parts;
  if (user.length <= 2) return `${user[0]}****@${domain}`;
  const first = user[0];
  const last = user[user.length - 1];
  return `${first}****${last}@${domain}`;
}

function getMaskedPhone(phone?: string): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 2) return '—';
  const last2 = digits.slice(-2);
  return `*********${last2}`;
}

export const ProfileScreen: React.FC = () => {
  const { authCustomer, navigateTo } = useApp();

  // Modal display states
  const [isEditContactOpen, setIsEditContactOpen] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState<boolean>(false);
  const [isSignOutOpen, setIsSignOutOpen] = useState<boolean>(false);

  const maskedEmail = getMaskedEmail(authCustomer?.email);
  const maskedPhone = getMaskedPhone(authCustomer?.phonenumber);

  const firstName = authCustomer?.firstname || '—';
  const middleInitial = authCustomer?.middleinitial || '—';
  const lastName = authCustomer?.lastname || '—';

  return (
    <View
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      className="flex-1 bg-white px-5 pt-3 pb-2"
    >
      {/* Back Navigation Bar & Screen Title */}
      <View className="flex-row items-center justify-between py-2 mb-3">
        <BackButton
          onPress={() => navigateTo('home')}
          accessibilityLabel="Back to Home"
          className="-ml-1"
        />
        <Text className="flex-1 text-center text-lg font-bold text-gray-900 tracking-tight">
          User Profile
        </Text>
        <View className="w-8 h-8" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Card 1: Profile overview */}
        <View className="rounded-2xl border border-gray-200 bg-white p-5 mb-4 shadow-sm">
          <Text className="text-[15px] font-bold text-gray-900 mb-4">
            Profile overview
          </Text>

          {/* First Name & Middle Initial Row */}
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-[11px] font-medium text-gray-400 mb-1">
                First name
              </Text>
              <Text className="text-sm font-bold text-gray-900">
                {firstName}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="text-[11px] font-medium text-gray-400 mb-1">
                Middle initial
              </Text>
              <Text className="text-sm font-bold text-gray-900">
                {middleInitial}
              </Text>
            </View>
          </View>

          {/* Last Name Row */}
          <View className="mt-4">
            <Text className="text-[11px] font-medium text-gray-400 mb-1">
              Last name
            </Text>
            <Text className="text-sm font-bold text-gray-900">
              {lastName}
            </Text>
          </View>
        </View>

        {/* Card 2: Contact details */}
        <View className="rounded-2xl border border-gray-200 bg-white p-5 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="text-[15px] font-bold text-gray-900">
              Contact details
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsEditContactOpen(true)}
              className="border border-[#215cd4] rounded-full px-3 py-1 items-center justify-center"
              accessibilityLabel="Edit Details"
            >
              <Text className="text-xs font-semibold text-[#215cd4]">
                Edit Details
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-gray-400 mt-1 mb-4 leading-normal">
            These are the details we use to reach you.
          </Text>

          <View className="mb-3">
            <Text className="text-[11px] font-medium text-gray-400 mb-0.5">
              Email
            </Text>
            <Text className="text-sm font-bold text-gray-900">
              {maskedEmail}
            </Text>
          </View>

          <View>
            <Text className="text-[11px] font-medium text-gray-400 mb-0.5">
              Phone number
            </Text>
            <Text className="text-sm font-bold text-gray-900">
              {maskedPhone}
            </Text>
          </View>
        </View>

        {/* Card 3: Password */}
        <View className="rounded-2xl border border-gray-200 bg-white p-5 mb-5 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="text-[15px] font-bold text-gray-900">
              Password
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsChangePasswordOpen(true)}
              className="border border-[#215cd4] rounded-full px-3 py-1 items-center justify-center"
              accessibilityLabel="Change password"
            >
              <Text className="text-xs font-semibold text-[#215cd4]">
                Change password
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Action Buttons */}
        <View className="mt-2 mb-4">
          {/* Delete Account button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsDeleteAccountOpen(true)}
            className="w-full h-12 rounded-2xl border border-red-300 bg-white active:bg-red-50 items-center justify-center mb-3 shadow-xs"
            accessibilityLabel="Delete Account"
          >
            <Text className="text-sm font-semibold text-[#ef4444] tracking-wide">
              Delete Account
            </Text>
          </TouchableOpacity>

          {/* Sign Out button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsSignOutOpen(true)}
            className="w-full h-12 rounded-2xl border border-gray-300 bg-white active:bg-gray-50 items-center justify-center shadow-xs"
            accessibilityLabel="Sign Out"
          >
            <Text className="text-sm font-semibold text-gray-800 tracking-wide">
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Persistent Bottom Navigation */}
      <BottomNav activeTab="profile" />

      {/* Visual Modals */}
      <EditContactModal
        visible={isEditContactOpen}
        onClose={() => setIsEditContactOpen(false)}
        maskedEmail={maskedEmail}
        maskedPhone={maskedPhone}
      />

      <ChangePasswordModal
        visible={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        maskedEmail={maskedEmail}
      />

      <DeleteAccountModal
        visible={isDeleteAccountOpen}
        onClose={() => setIsDeleteAccountOpen(false)}
      />

      <SignOutModal
        visible={isSignOutOpen}
        onClose={() => setIsSignOutOpen(false)}
      />
    </View>
  );
};
