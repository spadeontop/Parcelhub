import React from 'react';
import { View, Text } from 'react-native';
import { OrderStatus } from '../../types';

interface StaffBadgeProps {
  status: OrderStatus;
  variant?: 'card' | 'modal' | 'pill';
}

export const StaffBadge: React.FC<StaffBadgeProps> = ({ status, variant = 'card' }) => {
  let bgColor = 'bg-slate-700';
  let textColor = 'text-slate-300';
  let dotColor = 'bg-slate-400';
  let label: string = status;

  switch (status) {
    case 'PAYMENT_REQUIRED':
      bgColor = 'bg-rose-500/15 border-rose-500/30';
      textColor = 'text-rose-400';
      dotColor = 'bg-rose-500';
      label = 'Payment Due';
      break;
    case 'AWAITING_PARCEL':
      bgColor = 'bg-sky-500/15 border-sky-500/30';
      textColor = 'text-sky-400';
      dotColor = 'bg-sky-400';
      label = 'Awaiting Parcel';
      break;
    case 'READY_TO_CLAIM':
      bgColor = 'bg-emerald-500/15 border-emerald-500/30';
      textColor = 'text-emerald-400';
      dotColor = 'bg-emerald-400';
      label = 'Ready to Claim';
      break;
    case 'CLAIMED':
      bgColor = 'bg-slate-800 border-slate-700';
      textColor = 'text-slate-400';
      dotColor = 'bg-slate-500';
      label = 'Claimed';
      break;
    case 'PENDING_INITIALIZATION':
      bgColor = 'bg-amber-500/15 border-amber-500/30';
      textColor = 'text-amber-400';
      dotColor = 'bg-amber-400';
      label = 'Pending Init';
      break;
    case 'CANCELLED':
      bgColor = 'bg-red-500/15 border-red-500/30';
      textColor = 'text-red-400';
      dotColor = 'bg-red-500';
      label = 'Cancelled';
      break;
  }

  const isModal = variant === 'modal';

  return (
    <View
      className={`flex-row items-center border rounded-full ${bgColor} ${
        isModal ? 'px-3 py-1 gap-2' : 'px-2 py-0.5 gap-1.5'
      }`}
    >
      <View className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <Text className={`font-semibold tracking-wider uppercase ${textColor} ${isModal ? 'text-xs' : 'text-[10px]'}`}>
        {label}
      </Text>
    </View>
  );
};
