import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../layout/BottomNav';
import { AppHeader } from '../layout/AppHeader';
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
  const { height } = useWindowDimensions();
  const isCompact = height < 700;

  // Modal display states
  const [isEditContactOpen, setIsEditContactOpen] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState<boolean>(false);
  const [isSignOutOpen, setIsSignOutOpen] = useState<boolean>(false);

  const maskedEmail = getMaskedEmail(authCustomer?.email);
  const maskedPhone = getMaskedPhone(authCustomer?.phonenumber);

  const fullName = [
    authCustomer?.firstname,
    authCustomer?.middleinitial ? `${authCustomer.middleinitial}.` : null,
    authCustomer?.lastname,
  ]
    .filter(Boolean)
    .join(' ') || 'John Doe';

  return (
    <View className="flex-1 bg-[#2563eb]">
      <StatusBar style="light" />

      {/* Top Header */}
      <AppHeader
        title="Account Settings"
        subtitle="PROFILE & SECURITY"
      />

      {/* Main Sheet with Curved Transition */}
      <View className="flex-1 bg-[#f8fafc] rounded-t-[32px] pt-4 overflow-hidden">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* Card 1: CONTACT & DETAILS */}
          <View
            className="rounded-[16px] bg-white border border-[#f1f5f9] p-[17px] mb-4"
            style={{
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            {/* Header with Title and Edit Link */}
            <View className="flex-row items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <Text className="text-[12px] font-bold tracking-[0.6px] text-[#64748b] uppercase">
                CONTACT & DETAILS
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsEditContactOpen(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Edit Details"
              >
                <Text className="text-[12px] font-bold text-[#2563eb]">
                  Edit
                </Text>
              </TouchableOpacity>
            </View>

            {/* Full Name Row */}
            <View className="flex-row items-center justify-between py-3 border-b border-[#f8fafc]">
              <Text className="text-[12px] text-[#64748b]">
                Full Name
              </Text>
              <Text className="text-[14px] font-bold text-[#1e293b]">
                {fullName}
              </Text>
            </View>

            {/* Email Address Row */}
            <View className="flex-row items-center justify-between py-3 border-b border-[#f8fafc]">
              <Text className="text-[12px] text-[#64748b]">
                Email Address
              </Text>
              <Text className="text-[12px] font-bold font-mono text-[#1e293b]">
                {maskedEmail}
              </Text>
            </View>

            {/* Phone Number Row */}
            <View className="flex-row items-center justify-between py-3">
              <Text className="text-[12px] text-[#64748b]">
                Phone Number
              </Text>
              <Text className="text-[14px] font-bold text-[#1e293b] tracking-[0.7px]">
                {maskedPhone}
              </Text>
            </View>
          </View>

          {/* Card 2: SECURITY & LOGIN */}
          <View
            className="rounded-[16px] bg-white border border-[#f1f5f9] p-[17px] mb-4"
            style={{
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            {/* Header */}
            <View className="pb-3 border-b border-[#f1f5f9]">
              <Text className="text-[12px] font-bold tracking-[0.6px] text-[#64748b] uppercase">
                SECURITY & LOGIN
              </Text>
            </View>

            {/* Password Row */}
            <View className="flex-row items-center justify-between py-3.5">
              <View>
                <Text className="text-[12px] text-[#64748b]">
                  Password
                </Text>
                <Text className="text-[12px] font-bold text-[#1e293b] tracking-[1.2px] mt-0.5">
                  ••••••••
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsChangePasswordOpen(true)}
                className="bg-[#f1f5f9] px-3.5 py-1.5 rounded-[8px]"
                accessibilityLabel="Change Password"
              >
                <Text className="text-[12px] font-bold text-[#334155]">
                  Change
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card 3: PREFERENCES */}
          <View
            className="rounded-[16px] bg-white border border-[#f1f5f9] p-[17px] mb-4"
            style={{
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            {/* Header */}
            <View className="pb-3 border-b border-[#f1f5f9]">
              <Text className="text-[12px] font-bold tracking-[0.6px] text-[#64748b] uppercase">
                PREFERENCES
              </Text>
            </View>

            {/* Privacy & Data Rights Row */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsDeleteAccountOpen(true)}
              className="flex-row items-center justify-between pt-3 pb-1"
            >
              <View className="flex-1 pr-3">
                <Text className="text-[12px] text-[#334155] font-medium">
                  Privacy & Data Rights
                </Text>
                <Text className="text-[11px] text-[#94a3b8] mt-0.5">
                  Download data, deactivate or close account
                </Text>
              </View>

              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 18l6-6-6-6"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Sign Out Primary Outline Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsSignOutOpen(true)}
            className="w-full bg-white border border-[#cbd5e1] rounded-[12px] py-[13px] px-[17px] flex-row items-center justify-center mb-6"
            accessibilityLabel="Sign Out"
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                stroke="#334155"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M16 17l5-5-5-5"
                stroke="#334155"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M21 12H9"
                stroke="#334155"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text className="text-[14px] font-bold text-[#334155] tracking-[0.35px] ml-2">
              Sign Out
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Floating Bottom Nav inside the Main Sheet */}
        <BottomNav activeTab="profile" />
      </View>

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

export default ProfileScreen;
