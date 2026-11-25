import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StaffOrder } from '../../../types';
import { Check } from '../../common/Icons';
import { OrderCardContainer } from '../../common/OrderCardContainer';

interface ClaimedOrderTimelineProps {
  order: StaffOrder;
  onViewProof: () => void;
}

const formatDateMonth = (iso?: string, fallback = '—'): string => {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

const formatTimeShort = (iso?: string, fallback = '—'): string => {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const ClaimedOrderTimeline: React.FC<ClaimedOrderTimelineProps> = ({
  order,
  onViewProof,
}) => {
  const timeline = order.statusTimeline || [];
  const placedEntry =
    timeline.find((s) => s.status === 'PENDING_INITIALIZATION' || s.status === 'PAYMENT_REQUIRED') ||
    timeline[0];
  const awaitingEntry = timeline.find((s) => s.status === 'AWAITING_PARCEL');
  const readyEntry = timeline.find((s) => s.status === 'READY_TO_CLAIM');
  const claimedEntry = timeline.find((s) => s.status === 'CLAIMED');

  const claimedTimestamp = order.claimedAt || claimedEntry?.timestamp || order.timestamp;
  const readyTimestamp = readyEntry?.timestamp || order.courierPaidAt || order.claimInitiatedAt;
  const awaitingTimestamp = awaitingEntry?.timestamp || order.courierPaidAt;

  let placedTimestamp = order.createdAt || placedEntry?.timestamp;
  if (
    !placedTimestamp ||
    (claimedTimestamp && placedTimestamp === claimedTimestamp && (awaitingTimestamp || readyTimestamp))
  ) {
    placedTimestamp = awaitingTimestamp || readyTimestamp || claimedTimestamp;
  }

  return (
    <OrderCardContainer className="mb-4">
      <Text className="text-[11px] font-bold text-[#64748B] tracking-wider uppercase mb-4">
        TRACKING PROGRESS
      </Text>

      {/* Step 1: Order Placed */}
      <View className="flex-row items-start">
        <View className="w-14 items-end mr-3 pt-0.5">
          <Text className="text-[11.5px] font-bold text-[#64748B] text-right">
            {formatDateMonth(placedTimestamp)}
          </Text>
          <Text className="text-[10px] text-[#64748B] text-right mt-0.5">
            {formatTimeShort(placedTimestamp)}
          </Text>
        </View>
        <View className="w-5 items-center mr-3">
          <View className="w-4 h-4 rounded-full border-2 border-[#94A3B8] items-center justify-center bg-white mt-1">
            <View className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
          </View>
          <View className="w-[1.5px] h-10 bg-[#E2E8F0] my-1" />
        </View>
        <View className="flex-1 pb-4">
          <Text className="text-[13px] font-bold text-[#0F172A] leading-tight">
            Order Placed
          </Text>
          <Text className="text-[11px] font-normal text-[#64748B] mt-0.5 leading-[15px]">
            Order submitted via customer app
          </Text>
        </View>
      </View>

      {/* Step 2: Awaiting Parcel */}
      <View className="flex-row items-start">
        <View className="w-14 items-end mr-3 pt-0.5">
          <Text className="text-[11.5px] font-bold text-[#64748B] text-right">
            {formatDateMonth(awaitingTimestamp)}
          </Text>
          <Text className="text-[10px] text-[#64748B] text-right mt-0.5">
            {formatTimeShort(awaitingTimestamp)}
          </Text>
        </View>
        <View className="w-5 items-center mr-3">
          <View className="w-4 h-4 rounded-full border-2 border-[#94A3B8] items-center justify-center bg-white mt-1">
            <View className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
          </View>
          <View className="w-[1.5px] h-10 bg-[#E2E8F0] my-1" />
        </View>
        <View className="flex-1 pb-4">
          <Text className="text-[13px] font-bold text-[#0F172A] leading-tight">
            Awaiting Parcel
          </Text>
          <Text className="text-[11px] font-normal text-[#64748B] mt-0.5 leading-[15px]">
            Hub awaiting courier drop-off
          </Text>
        </View>
      </View>

      {/* Step 3: Ready to Claim */}
      <View className="flex-row items-start">
        <View className="w-14 items-end mr-3 pt-0.5">
          <Text className="text-[11.5px] font-bold text-[#64748B] text-right">
            {formatDateMonth(readyTimestamp)}
          </Text>
          <Text className="text-[10px] text-[#64748B] text-right mt-0.5">
            {formatTimeShort(readyTimestamp)}
          </Text>
        </View>
        <View className="w-5 items-center mr-3">
          <View className="w-4 h-4 rounded-full border-2 border-[#94A3B8] items-center justify-center bg-white mt-1">
            <View className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
          </View>
          <View className="w-[1.5px] h-12 bg-[#15803D] my-1" />
        </View>
        <View className="flex-1 pb-4">
          <Text className="text-[13px] font-bold text-[#0F172A] leading-tight">
            Ready to Claim
          </Text>
          <Text className="text-[11px] font-normal text-[#64748B] mt-0.5 leading-[15px]">
            Parcel logged at hub for pickup
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onViewProof}
            className="mt-1 self-start"
          >
            <Text className="text-[11px] font-bold text-[#2563EB]">
              View Proof of Delivery
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Step 4: Parcel Claimed */}
      <View className="flex-row items-start">
        <View className="w-14 items-end mr-3 pt-0.5">
          <Text className="text-[11.5px] font-bold text-[#15803D] text-right">
            {formatDateMonth(claimedTimestamp)}
          </Text>
          <Text className="text-[10px] text-[#15803D] text-right mt-0.5">
            {formatTimeShort(claimedTimestamp)}
          </Text>
        </View>
        <View className="w-5 items-center mr-3">
          <View className="w-4 h-4 rounded-full bg-[#15803D] items-center justify-center mt-1">
            <Check size={10} color="#FFFFFF" strokeWidth={3} />
          </View>
        </View>
        <View className="flex-1">
          <Text className="text-[13px] font-bold text-[#0F172A] leading-tight">
            Parcel Claimed
          </Text>
          <Text className="text-[11px] font-bold text-[#15803D] mt-0.5 leading-[15px]">
            Parcel successfully claimed by recipient
          </Text>
        </View>
      </View>
    </OrderCardContainer>
  );
};
