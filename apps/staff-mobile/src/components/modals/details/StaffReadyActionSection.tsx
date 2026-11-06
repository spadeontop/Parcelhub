import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StaffOrder } from '../../../types';
import { CheckCircle, Clock, Lock, Unlock, AlertCircle } from '../../common/Icons';

interface StaffReadyActionSectionProps {
  order: StaffOrder;
  isReleasing: boolean;
  onRelease: (orderId: string) => Promise<void>;
}

export const StaffReadyActionSection: React.FC<StaffReadyActionSectionProps> = ({
  order,
  isReleasing,
  onRelease,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(order.claimRemainingSeconds || 0);

  useEffect(() => {
    setSecondsRemaining(order.claimRemainingSeconds || 0);
  }, [order.claimRemainingSeconds]);

  // Local live tick every 1 second when claim is active
  useEffect(() => {
    if (!order.isClaimActive || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [order.isClaimActive, secondsRemaining]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isPassActive = order.isClaimActive && secondsRemaining > 0;

  return (
    <View className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-4 mb-3 space-y-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          {isPassActive ? (
            <Unlock size={16} color="#34d399" />
          ) : (
            <Lock size={16} color="#f59e0b" />
          )}
          <Text className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Counter Pickup & Release
          </Text>
        </View>

        <View
          className={`px-2 py-0.5 rounded-full border ${
            isPassActive
              ? 'bg-emerald-950 border-emerald-800'
              : 'bg-amber-950 border-amber-800'
          }`}
        >
          <Text
            className={`text-[10px] font-bold ${
              isPassActive ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {isPassActive ? 'PASS UNLOCKED' : 'PASS LOCKED'}
          </Text>
        </View>
      </View>

      {/* Countdown or Waiting Notice */}
      {isPassActive ? (
        <View className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-3 items-center">
          <Text className="text-[11px] text-emerald-400 font-semibold mb-1">
            Customer Active Handover Window
          </Text>
          <Text className="text-3xl font-mono font-black text-white tracking-widest my-1">
            {formattedTime}
          </Text>
          <Text className="text-[10px] text-slate-400 text-center">
            Verified via customer MPIN. Confirm recipient identity and release parcel.
          </Text>
        </View>
      ) : (
        <View className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex-row items-center gap-2.5">
          <AlertCircle size={18} color="#f59e0b" className="shrink-0" />
          <View className="flex-1">
            <Text className="text-xs font-bold text-white">Awaiting Customer Verification</Text>
            <Text className="text-[10px] text-slate-400 leading-tight mt-0.5">
              The customer unlocks their 5-minute counter pass in the Customer Mobile app by verifying their MPIN.
            </Text>
          </View>
        </View>
      )}

      {/* Primary Handover Release Button */}
      <TouchableOpacity
        onPress={() => onRelease(order.id)}
        disabled={isReleasing}
        className="bg-emerald-600 active:bg-emerald-700 py-3.5 rounded-xl flex-row items-center justify-center gap-2"
      >
        {isReleasing ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <CheckCircle size={16} color="#ffffff" />
            <Text className="text-white font-bold text-xs uppercase tracking-wider">
              Release Parcel to Customer
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};
