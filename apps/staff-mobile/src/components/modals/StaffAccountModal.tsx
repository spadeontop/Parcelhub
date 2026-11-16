import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { X } from '../common/Icons';
import { useStaff } from '../../context/StaffContext';

export interface StaffAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffAccountModal: React.FC<StaffAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { staffUser, logout } = useStaff();

  const handleSignOut = async () => {
    onClose();
    await logout();
  };

  const staffName = staffUser?.name || 'John Doe';
  const staffId = staffUser?.id || 'STF-1991';
  const staffRole = staffUser?.role || 'Staff';
  const hubWorkspace = staffUser?.hubName || "LILY'S CATERING HUB";

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        {/* Dismiss backdrop */}
        <Pressable
          className="flex-1"
          onPress={onClose}
          accessibilityLabel="Dismiss account modal"
        />

        {/* Staff Account Sheet matching Figma 1336:3 */}
        <View
          style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          className="bg-white pt-3 pb-9 px-6 shadow-2xl"
        >
          {/* Sheet Handle */}
          <View className="w-[34px] h-[4px] bg-[#CBD5E1] rounded-full mx-auto mb-4" />

          {/* Top Header Row */}
          <View className="flex-row items-start justify-between">
            <View>
              <Text className="text-[22px] font-semibold text-[#0F172A] leading-8">
                Your account
              </Text>
              <Text className="text-[13px] font-normal text-[#64748B] mt-0.5">
                Your signed-in staff details.
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="w-10 h-10 rounded-full bg-[#F1F5F9] items-center justify-center active:bg-slate-200"
              accessibilityLabel="Close staff account"
            >
              <X size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Signed-in Staff User & Status */}
          <View className="flex-row items-center justify-between mt-6">
            <Text className="text-[23px] font-semibold text-[#0F172A]">
              {staffName}
            </Text>
            <View className="bg-[#ECFDF5] px-3 py-1 rounded-full">
              <Text className="text-[11px] font-medium text-[#047857]">
                Signed in
              </Text>
            </View>
          </View>

          {/* Staff Details Card */}
          <View className="bg-[#F8FAFC] border border-slate-100 rounded-[14px] p-4 mt-4">
            {/* Staff ID */}
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-[12px] font-normal text-[#64748B]">Staff ID</Text>
              <Text className="text-[12px] font-medium text-[#334155]">{staffId}</Text>
            </View>

            <View className="h-[1px] bg-[#E2E8F0] my-2.5" />

            {/* Role */}
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-[12px] font-normal text-[#64748B]">Role</Text>
              <Text className="text-[12px] font-medium text-[#334155]">{staffRole}</Text>
            </View>

            <View className="h-[1px] bg-[#E2E8F0] my-2.5" />

            {/* Workspace */}
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-[12px] font-normal text-[#64748B]">Workspace</Text>
              <Text className="text-[11px] font-medium text-[#334155]">{hubWorkspace}</Text>
            </View>
          </View>

          {/* Admin Managed Note */}
          <Text className="text-[12px] font-normal text-[#64748B] mt-4">
            These details are managed by your administrator.
          </Text>

          {/* Log Out Button */}
          <TouchableOpacity
            onPress={handleSignOut}
            activeOpacity={0.8}
            className="w-full bg-[#FEF2F2] border border-[#FECACA] rounded-[12px] h-[48px] items-center justify-center mt-5 active:bg-rose-100"
          >
            <Text className="text-[14px] font-semibold text-[#B91C1C]">
              Log out
            </Text>
          </TouchableOpacity>

          {/* Subtext */}
          <Text className="text-[11px] font-normal text-[#64748B] text-center mt-3">
            You&apos;ll return to the staff sign-in screen.
          </Text>
        </View>
      </View>
    </Modal>
  );
};
