import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StaffOrder } from '../../../types';
import { useStaff } from '../../../context/StaffContext';
import { X } from '../../common/Icons';
import { StaffOrderHeroBanner } from './StaffOrderHeroBanner';
import { StaffParcelInfoSection } from './StaffParcelInfoSection';
import { StaffFinancialLedgerSection } from './StaffFinancialLedgerSection';
import { StaffUnpaidActionSection } from './StaffUnpaidActionSection';
import { StaffActiveActionSection } from './StaffActiveActionSection';
import { StaffReadyActionSection } from './StaffReadyActionSection';
import { StaffClaimedSummarySection } from './StaffClaimedSummarySection';
import { StaffNotesSection } from './StaffNotesSection';

interface StaffOrderDetailsModalProps {
  order: StaffOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StaffOrderDetailsModal: React.FC<StaffOrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const {
    activateOrder,
    payCourier,
    attachPhoto,
    claimOrder,
    updateOrderNotes,
  } = useStaff();

  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [isPayingCourier, setIsPayingCourier] = useState<boolean>(false);
  const [isAttachingPhoto, setIsAttachingPhoto] = useState<boolean>(false);
  const [isReleasing, setIsReleasing] = useState<boolean>(false);

  if (!order) return null;

  const handleActivate = async (orderId: string, amount: number) => {
    setIsActivating(true);
    try {
      await activateOrder(orderId, amount);
    } finally {
      setIsActivating(false);
    }
  };

  const handlePayCourier = async (orderId: string) => {
    setIsPayingCourier(true);
    try {
      await payCourier(orderId);
    } finally {
      setIsPayingCourier(false);
    }
  };

  const handleAttachPhoto = async (orderId: string, imageUrl: string) => {
    setIsAttachingPhoto(true);
    try {
      await attachPhoto(orderId, imageUrl);
    } finally {
      setIsAttachingPhoto(false);
    }
  };

  const handleRelease = async (orderId: string) => {
    setIsReleasing(true);
    try {
      await claimOrder(orderId);
      onClose();
    } finally {
      setIsReleasing(false);
    }
  };

  const handleSaveNotes = (notes: string) => {
    updateOrderNotes(order.id, notes);
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-slate-950">
        {/* Modal Top Bar */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
          <View>
            <Text className="text-white font-bold text-base">Order Management</Text>
            <Text className="text-[11px] text-slate-400 font-mono">Counter Action Drill-down</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center active:bg-slate-700"
            accessibilityLabel="Close Order Management modal"
          >
            <X size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Modal Scroll Content */}
        <ScrollView
          className="flex-1 px-4 pt-3"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Banner */}
          <StaffOrderHeroBanner order={order} />

          {/* Contextual Action Section based on Order State */}
          {order.status === 'PAYMENT_REQUIRED' && (
            <StaffUnpaidActionSection
              order={order}
              isSubmitting={isActivating}
              onActivate={handleActivate}
            />
          )}

          {order.status === 'AWAITING_PARCEL' && (
            <StaffActiveActionSection
              order={order}
              isPayingCourier={isPayingCourier}
              isAttachingPhoto={isAttachingPhoto}
              onPayCourier={handlePayCourier}
              onAttachPhoto={handleAttachPhoto}
            />
          )}

          {order.status === 'READY_TO_CLAIM' && (
            <StaffReadyActionSection
              order={order}
              isReleasing={isReleasing}
              onRelease={handleRelease}
            />
          )}

          {order.status === 'CLAIMED' && (
            <StaffClaimedSummarySection order={order} />
          )}

          {/* Parcel & Recipient Specs */}
          <StaffParcelInfoSection order={order} />

          {/* Ledger */}
          <StaffFinancialLedgerSection order={order} />

          {/* Notes */}
          <StaffNotesSection
            initialNotes={order.notes}
            onSaveNotes={handleSaveNotes}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
