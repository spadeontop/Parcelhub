import React from 'react';
import { View, Text } from 'react-native';
import { OrderStatus } from '../../types';

interface StaffBadgeProps {
  status: OrderStatus;
  variant?: 'card' | 'modal' | 'pill';
}

export const StaffBadge: React.FC<StaffBadgeProps> = ({ status, variant = 'card' }) => {
  let bgColor = 'bg-slate-100';
  let textColor = 'text-slate-600';
  let label: string = status;

  switch (status) {
    case 'READY_TO_CLAIM':
      bgColor = 'bg-blue-50';
      textColor = 'text-[#215CD4]';
      label = 'Ready';
      break;
    case 'AWAITING_PARCEL':
      bgColor = 'bg-slate-100';
      textColor = 'text-slate-700';
      label = 'Active';
      break;
    case 'PAYMENT_REQUIRED':
      bgColor = 'bg-amber-50';
      textColor = 'text-amber-700';
      label = 'Unpaid';
      break;
    case 'CLAIMED':
      bgColor = 'bg-slate-100';
      textColor = 'text-slate-500';
      label = 'Claimed';
      break;
    case 'PENDING_INITIALIZATION':
      bgColor = 'bg-orange-50';
      textColor = 'text-orange-700';
      label = 'Pending';
      break;
    case 'CANCELLED':
      bgColor = 'bg-rose-50';
      textColor = 'text-rose-700';
      label = 'Cancelled';
      break;
  }

  const isModal = variant === 'modal';

  return (
    <View
      className={`flex-row items-center justify-center rounded-full ${bgColor} ${
        isModal ? 'px-3 py-1' : 'px-2.5 py-0.5'
      }`}
    >
      <Text
        className={`font-semibold tracking-wide ${textColor} ${
          isModal ? 'text-xs' : 'text-[11px]'
        }`}
      >
        {label}
      </Text>
    </View>
  );
};
