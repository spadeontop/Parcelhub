import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import { StaffOrder } from '../../../types';
import { Check, CheckCircle, X } from '../../common/Icons';

interface StaffClaimedSummarySectionProps {
  order: StaffOrder;
  onReturnHome: () => void;
}

const sampleWaybill = require('../../../../assets/parcelhub/sample_parcel_waybill.png');

const formatDateTime = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const formatTimeOnly = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const StaffClaimedSummarySection: React.FC<StaffClaimedSummarySectionProps> = ({
  order,
  onReturnHome,
}) => {
  const [isPodModalOpen, setIsPodModalOpen] = useState<boolean>(false);

  // Chronological timeline milestones sourced from statusTimeline or dedicated timestamps
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
  if (!placedTimestamp || (claimedTimestamp && placedTimestamp === claimedTimestamp && (awaitingTimestamp || readyTimestamp))) {
    placedTimestamp = awaitingTimestamp || readyTimestamp || claimedTimestamp;
  }

  const hasRemoteProof = Boolean(
    order.proofImageUrl &&
      (order.proofImageUrl.startsWith('http://') ||
        order.proofImageUrl.startsWith('https://') ||
        order.proofImageUrl.startsWith('data:') ||
        order.proofImageUrl.startsWith('file://'))
  );

  return (
    <View className="gap-4">
      {/* Tracking Progress Receipt Card matching Figma Frame 3 */}
      <View
        className="bg-white border border-[#F1F5F9] rounded-2xl p-5"
        style={{
          shadowColor: '#111827',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Text className="text-[11px] font-bold text-[#94A3B8] tracking-wider uppercase mb-4">
          TRACKING PROGRESS
        </Text>

        {/* Step 1: Order Placed */}
        <View className="flex-row">
          <View className="w-6 items-center mr-3">
            <View className="w-5 h-5 rounded-full bg-white border-[1.5px] border-[#94A3B8] items-center justify-center">
              <Check size={11} color="#94A3B8" strokeWidth={2.5} />
            </View>
            <View className="w-[2px] flex-1 bg-[#E2E8F0]" />
          </View>
          <View className="flex-1 pb-5">
            <View className="flex-row items-center justify-between gap-2">
              <Text className="text-xs font-bold text-[#1E293B] leading-[15px]">
                Order Placed
              </Text>
              <Text className="text-[10.5px] text-[#94A3B8] leading-[13px] text-right">
                {formatDateTime(placedTimestamp)}
              </Text>
            </View>
            <Text className="text-[11px] text-[#64748B] leading-[14px] mt-0.5">
              Order by the user from the app
            </Text>
          </View>
        </View>

        {/* Step 2: Awaiting Parcel */}
        <View className="flex-row">
          <View className="w-6 items-center mr-3">
            <View className="w-5 h-5 rounded-full bg-white border-[1.5px] border-[#94A3B8] items-center justify-center">
              <Check size={11} color="#94A3B8" strokeWidth={2.5} />
            </View>
            <View className="w-[2px] flex-1 bg-[#E2E8F0]" />
          </View>
          <View className="flex-1 pb-5">
            <View className="flex-row items-center justify-between gap-2">
              <Text className="text-xs font-bold text-[#1E293B] leading-[15px]">
                Awaiting Parcel
              </Text>
              <Text className="text-[10.5px] text-[#94A3B8] leading-[13px] text-right">
                {formatTimeOnly(awaitingTimestamp)}
              </Text>
            </View>
            <Text className="text-[11px] text-[#64748B] leading-[14px] mt-0.5">
              The hub received the item
            </Text>
          </View>
        </View>

        {/* Step 3: Ready to Claim */}
        <View className="flex-row">
          <View className="w-6 items-center mr-3">
            <View className="w-5 h-5 rounded-full bg-white border-[1.5px] border-[#94A3B8] items-center justify-center">
              <Check size={11} color="#94A3B8" strokeWidth={2.5} />
            </View>
            <View className="w-[2px] flex-1 bg-[#E2E8F0]" />
          </View>
          <View className="flex-1 pb-5">
            <View className="flex-row items-center justify-between gap-2">
              <Text className="text-xs font-bold text-[#1E293B] leading-[15px]">
                Ready to Claim
              </Text>
              <Text className="text-[10.5px] text-[#94A3B8] leading-[13px] text-right">
                {formatTimeOnly(readyTimestamp)}
              </Text>
            </View>
            <Text className="text-[11px] text-[#64748B] leading-[14px] mt-0.5">
              Stored in bin, notified recipient
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsPodModalOpen(true)}
              className="mt-1.5 self-start"
            >
              <Text className="text-[10.5px] font-bold text-[#215CD4] leading-[13px]">
                View Proof of Delivery
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 4: Parcel Claimed */}
        <View className="flex-row">
          <View className="w-6 items-center mr-3">
            <View className="w-[22px] h-[22px] rounded-full bg-[#94A3B8] border-[1.5px] border-[#94A3B8] items-center justify-center">
              <Check size={12} color="#FFFFFF" strokeWidth={2.8} />
            </View>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between gap-2">
              <Text className="text-xs font-bold text-[#0F172A] leading-[15px]">
                Parcel Claimed
              </Text>
              <Text className="text-[10.5px] font-bold text-[#94A3B8] leading-[13px] text-right">
                {formatTimeOnly(claimedTimestamp)}
              </Text>
            </View>
            <Text className="text-[11px] text-[#64748B] leading-[14px] mt-0.5">
              Handover verified. Cash returned.
            </Text>
          </View>
        </View>
      </View>

      {/* Confirmation & Return to Home Secondary Action matching Figma */}
      <View className="items-center pt-1 pb-2 gap-3.5">
        <Text className="text-[11.5px] text-[#64748B] text-center leading-[14px] px-2">
          This transaction has been settled and archived.
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onReturnHome}
          className="py-2 px-6 items-center justify-center"
        >
          <Text className="text-xs font-semibold text-[#475569] text-center leading-4">
            Return to Home
          </Text>
        </TouchableOpacity>
      </View>

      {/* Proof of Delivery Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={isPodModalOpen}
        onRequestClose={() => setIsPodModalOpen(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-5">
          <View
            className="w-full max-w-sm bg-white rounded-3xl p-5 border border-[#E2E8F0]"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <View className="flex-row items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <View>
                <Text className="text-base font-bold text-[#0F172A]">
                  Proof of Delivery
                </Text>
                <Text className="text-xs text-[#64748B]">
                  Delivery Verification Photo
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsPodModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F1F5F9] items-center justify-center"
                accessibilityLabel="Close Proof of Delivery"
              >
                <X size={16} color="#475569" />
              </TouchableOpacity>
            </View>

            <View className="relative rounded-2xl overflow-hidden border border-[#E2E8F0] bg-slate-100 mt-4">
              <Image
                source={hasRemoteProof ? { uri: order.proofImageUrl! } : sampleWaybill}
                style={{ width: '100%', height: 210 }}
                resizeMode="cover"
              />
              <View className="absolute top-3 left-3 flex-row items-center gap-1.5 bg-[#059669] px-3 py-1.5 rounded-full">
                <CheckCircle size={13} color="#FFFFFF" strokeWidth={2.5} />
                <Text className="text-white text-[11px] font-bold">
                  AI Verified: Clear &amp; Valid Parcel
                </Text>
              </View>
            </View>

            <View className="mt-4 p-3 bg-[#F8FAFC] rounded-2xl border border-[#F1F5F9] gap-1.5">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-[#64748B]">Order ID</Text>
                <Text className="text-xs font-bold text-[#0F172A] font-mono">
                  {order.id}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-[#64748B]">Tracking Number</Text>
                <Text className="text-xs font-bold text-[#0F172A] font-mono">
                  {order.trackingId || 'N/A'}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-[#64748B]">Recipient</Text>
                <Text className="text-xs font-semibold text-[#0F172A]">
                  {order.customer}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsPodModalOpen(false)}
              className="w-full mt-4 py-3.5 bg-[#215CD4] rounded-xl items-center justify-center"
            >
              <Text className="text-white font-bold text-xs">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
