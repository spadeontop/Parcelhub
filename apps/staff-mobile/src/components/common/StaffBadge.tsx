import React from 'react';
import { View, Text } from 'react-native';
import { OrderStatus } from '../../types';

interface StaffBadgeProps {
  status: OrderStatus;
  variant?: 'card' | 'modal' | 'pill';
}

export const StaffBadge: React.FC<StaffBadgeProps> = ({ status, variant = 'card' }) => {
  let bgColor = 'bg-[#F1F5F9]';
  let textColor = 'text-[#64748B]';
  let label: string = status;

  switch (status) {
    case 'PENDING_INITIALIZATION':
      bgColor = 'bg-[#F1F5F9]';
      textColor = 'text-[#64748B]';
      label = 'Pending Initialization';
      break;
    case 'PAYMENT_REQUIRED':
      bgColor = 'bg-[#FFFBEB]';
      textColor = 'text-[#B45309]';
      label = 'Payment Required';
      break;
    case 'AWAITING_PARCEL':
      bgColor = 'bg-[#EFF6FF]';
      textColor = 'text-[#1D4ED8]';
      label = 'Awaiting Parcel';
      break;
    case 'READY_TO_CLAIM':
      bgColor = 'bg-[#ECFDF5]';
      textColor = 'text-[#047857]';
      label = 'Ready to Claim';
      break;
    case 'CLAIMED':
      bgColor = 'bg-[#F3E8FF]';
      textColor = 'text-[#7E22CE]';
      label = 'Claimed';
      break;
    case 'CANCELLED':
      bgColor = 'bg-[#FEF2F2]';
      textColor = 'text-[#DC2626]';
      label = 'Cancelled';
      break;
  }

  const isModal = variant === 'modal';

  return (
    <View
      className={`flex-row items-center justify-center rounded-[9px] ${bgColor} ${
        isModal ? 'px-3 py-1' : 'px-2 py-0.5'
      }`}
    >
      <Text
        className={`font-medium ${textColor} ${
          isModal ? 'text-xs' : 'text-[9px]'
        }`}
      >
        {label}
      </Text>
    </View>
  );
};
