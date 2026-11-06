import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StaffOrder } from '../../../types';
import { Truck, DollarSign, Camera, CheckCircle, ExternalLink } from '../../common/Icons';

interface StaffActiveActionSectionProps {
  order: StaffOrder;
  isPayingCourier: boolean;
  isAttachingPhoto: boolean;
  onPayCourier: (orderId: string) => Promise<void>;
  onAttachPhoto: (orderId: string, imageUrl: string) => Promise<void>;
}

export const StaffActiveActionSection: React.FC<StaffActiveActionSectionProps> = ({
  order,
  isPayingCourier,
  isAttachingPhoto,
  onPayCourier,
  onAttachPhoto,
}) => {
  const [photoUrl, setPhotoUrl] = useState<string>(order.proofImageUrl || '');

  const defaultSampleProofUrl = `https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80`;

  const handleFillSample = () => {
    setPhotoUrl(defaultSampleProofUrl);
  };

  const handleAttachSubmit = async () => {
    if (!photoUrl.trim() || isAttachingPhoto) return;
    await onAttachPhoto(order.id, photoUrl.trim());
  };

  return (
    <View className="bg-sky-950/20 border border-sky-900/40 rounded-2xl p-4 mb-3 space-y-4">
      <View className="flex-row items-center gap-2">
        <Truck size={16} color="#38bdf8" />
        <Text className="text-xs font-bold text-sky-400 uppercase tracking-wider">
          Courier Arrival & Parcel Intake
        </Text>
      </View>

      {/* Step 1: Courier Payout */}
      <View className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <DollarSign size={14} color={order.courierPaid ? '#34d399' : '#f59e0b'} />
            <Text className="text-xs font-bold text-white">Step 1: Courier Payout</Text>
          </View>
          {order.courierPaid && (
            <View className="bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
              <Text className="text-[10px] font-bold text-emerald-400">PAID</Text>
            </View>
          )}
        </View>

        <Text className="text-[11px] text-slate-400">
          Disburse COD / delivery fee to the courier rider upon package drop-off.
        </Text>

        {order.courierPaid ? (
          <View className="bg-emerald-950/30 border border-emerald-900/40 rounded-lg p-2.5 flex-row items-center gap-2">
            <CheckCircle size={15} color="#34d399" />
            <Text className="text-xs text-emerald-300 font-medium">
              Courier fee disbursed {order.courierPaidByName ? `by ${order.courierPaidByName}` : 'successfully'}.
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => onPayCourier(order.id)}
            disabled={isPayingCourier}
            className="bg-blue-600 active:bg-blue-700 py-2.5 rounded-lg flex-row items-center justify-center gap-2"
          >
            {isPayingCourier ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <DollarSign size={14} color="#ffffff" />
                <Text className="text-white font-bold text-xs uppercase tracking-wider">
                  Confirm Payout to Courier
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Step 2: Proof Photo Upload */}
      <View className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-2.5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Camera size={14} color="#38bdf8" />
            <Text className="text-xs font-bold text-white">Step 2: Attach Proof Photo</Text>
          </View>
          <TouchableOpacity onPress={handleFillSample}>
            <Text className="text-[10px] font-semibold text-sky-400">Paste Sample URL</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-[11px] text-slate-400">
          Provide parcel intake proof photo URL to make this package ready for customer claim.
        </Text>

        <View className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5">
          <TextInput
            value={photoUrl}
            onChangeText={setPhotoUrl}
            placeholder="https://storage.parcelhub.com/proof/ORD-xxx.jpg"
            placeholderTextColor="#64748b"
            className="text-xs text-white py-1 font-mono"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          onPress={handleAttachSubmit}
          disabled={!photoUrl.trim() || isAttachingPhoto}
          className={`py-3 rounded-lg flex-row items-center justify-center gap-2 ${
            photoUrl.trim() && !isAttachingPhoto
              ? 'bg-sky-600 active:bg-sky-700'
              : 'bg-slate-800 opacity-50'
          }`}
        >
          {isAttachingPhoto ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <CheckCircle size={15} color="#ffffff" />
              <Text className="text-white font-bold text-xs uppercase tracking-wider">
                Attach Proof & Make Claimable
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
