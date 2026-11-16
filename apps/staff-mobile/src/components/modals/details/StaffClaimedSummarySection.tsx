import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  Animated,
  PanResponder,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import { StaffOrder } from '../../../types';
import { Check, X, Plus, Minus } from '../../common/Icons';
import { OrderCardContainer } from '../../common/OrderCardContainer';
import { PaymentSummaryCard } from './PaymentSummaryCard';

interface StaffClaimedSummarySectionProps {
  order: StaffOrder;
  onReturnHome: () => void;
}

const sampleWaybill = require('../../../../assets/parcelhub/sample_parcel_waybill.png');

const formatDateMonth = (iso?: string, fallback = '17 Oct'): string => {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

const formatTimeShort = (iso?: string, fallback = '12:00'): string => {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const StaffClaimedSummarySection: React.FC<StaffClaimedSummarySectionProps> = ({
  order,
  onReturnHome,
}) => {
  const [isPodModalOpen, setIsPodModalOpen] = useState<boolean>(false);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Photo size tailored for mobile view: clearly visible, comfortable margins, not cramped or overflowing
  const imageWidth = Math.min(windowWidth - 32, 420);
  const imageHeight = Math.min(windowHeight * 0.65, 520);

  const [displayScale, setDisplayScale] = useState<number>(1);
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const currentScale = useRef<number>(1);
  const currentPan = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialDistance = useRef<number | null>(null);
  const initialScale = useRef<number>(1);
  const lastTap = useRef<number>(0);

  useEffect(() => {
    const scaleListener = scale.addListener(({ value }) => {
      currentScale.current = value;
    });
    const panListener = pan.addListener((value) => {
      currentPan.current = value;
    });
    return () => {
      scale.removeListener(scaleListener);
      pan.removeListener(panListener);
    };
  }, [scale, pan]);

  // Reset zoom whenever modal opens
  useEffect(() => {
    if (isPodModalOpen) {
      scale.setValue(1);
      pan.setValue({ x: 0, y: 0 });
      currentScale.current = 1;
      currentPan.current = { x: 0, y: 0 };
      setDisplayScale(1);
    }
  }, [isPodModalOpen]);

  const animateTo = (targetScale: number) => {
    const clampedScale = Math.max(1, Math.min(targetScale, 4));
    setDisplayScale(Number(clampedScale.toFixed(1)));
    if (clampedScale === 1) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.spring(scale, { toValue: clampedScale, useNativeDriver: true }).start();
    }
  };

  const handleClose = () => {
    scale.setValue(1);
    pan.setValue({ x: 0, y: 0 });
    currentScale.current = 1;
    currentPan.current = { x: 0, y: 0 };
    setDisplayScale(1);
    setIsPodModalOpen(false);
  };

  const calcDistance = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return (
          evt.nativeEvent.touches.length === 2 ||
          currentScale.current > 1.05 ||
          Math.abs(gestureState.dx) > 4 ||
          Math.abs(gestureState.dy) > 4
        );
      },
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          initialDistance.current = calcDistance(
            touches[0].pageX,
            touches[0].pageY,
            touches[1].pageX,
            touches[1].pageY
          );
          initialScale.current = currentScale.current;
        } else if (touches.length === 1) {
          pan.setOffset({
            x: currentPan.current.x,
            y: currentPan.current.y,
          });
          pan.setValue({ x: 0, y: 0 });

          const now = Date.now();
          if (now - lastTap.current < 300) {
            if (currentScale.current > 1.2) {
              animateTo(1);
            } else {
              animateTo(2.5);
            }
          }
          lastTap.current = now;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2 && initialDistance.current) {
          const dist = calcDistance(
            touches[0].pageX,
            touches[0].pageY,
            touches[1].pageX,
            touches[1].pageY
          );
          const ratio = dist / initialDistance.current;
          const newScale = Math.max(1, Math.min(initialScale.current * ratio, 4));
          scale.setValue(newScale);
        } else if (touches.length === 1 && currentScale.current > 1.05) {
          pan.x.setValue(gestureState.dx);
          pan.y.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: () => {
        initialDistance.current = null;
        pan.flattenOffset();
        setDisplayScale(Number(currentScale.current.toFixed(1)));

        if (currentScale.current <= 1.05) {
          animateTo(1);
        } else {
          const maxPanX = Math.max(0, ((currentScale.current - 1) * imageWidth) / 2);
          const maxPanY = Math.max(0, ((currentScale.current - 1) * imageHeight) / 2);
          const clampedX = Math.max(-maxPanX, Math.min(maxPanX, currentPan.current.x));
          const clampedY = Math.max(-maxPanY, Math.min(maxPanY, currentPan.current.y));

          if (clampedX !== currentPan.current.x || clampedY !== currentPan.current.y) {
            Animated.spring(pan, {
              toValue: { x: clampedX, y: clampedY },
              useNativeDriver: true,
            }).start();
          }
        }
      },
      onPanResponderTerminate: () => {
        initialDistance.current = null;
        pan.flattenOffset();
        setDisplayScale(Number(currentScale.current.toFixed(1)));
      },
    })
  ).current;

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

  const price = typeof order.amountToPay === 'number' ? order.amountToPay : 480;
  const paidAmount =
    typeof order.amountReceived === 'number'
      ? order.amountReceived
      : Math.max(500, price);
  const change =
    typeof order.change === 'number'
      ? order.change
      : Math.max(0, paidAmount - price);

  return (
    <View>
      {/* Payment Summary Card matching Figma 1346:2136 */}
      <PaymentSummaryCard
        price={price}
        paidAmount={paidAmount}
        change={change}
        className="mb-4"
      />

      {/* Tracking Progress Receipt Card matching Figma 1346:2136 */}
      <OrderCardContainer className="mb-4">
        <Text className="text-[11px] font-bold text-[#64748B] tracking-wider uppercase mb-4">
          TRACKING PROGRESS
        </Text>

        {/* Step 1: Order Placed */}
        <View className="flex-row items-start">
          <View className="w-14 items-end mr-3 pt-0.5">
            <Text className="text-[11.5px] font-bold text-[#64748B] text-right">
              {formatDateMonth(placedTimestamp, '17 Oct')}
            </Text>
            <Text className="text-[10px] text-[#64748B] text-right mt-0.5">
              {formatTimeShort(placedTimestamp, '16:32')}
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
              {formatDateMonth(awaitingTimestamp, '17 Oct')}
            </Text>
            <Text className="text-[10px] text-[#64748B] text-right mt-0.5">
              {formatTimeShort(awaitingTimestamp, '18:32')}
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
              {formatDateMonth(readyTimestamp, '17 Oct')}
            </Text>
            <Text className="text-[10px] text-[#64748B] text-right mt-0.5">
              {formatTimeShort(readyTimestamp, '22:32')}
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
              onPress={() => setIsPodModalOpen(true)}
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
              {formatDateMonth(claimedTimestamp, '18 Oct')}
            </Text>
            <Text className="text-[10px] text-[#15803D] text-right mt-0.5">
              {formatTimeShort(claimedTimestamp, '08:11')}
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

      {/* Summary Note & Return to Home Button (consistent with other states) */}
      <View className="items-center pt-1 pb-4">
        <Text className="text-[11.5px] text-[#64748B] text-center mb-3">
          Order completed and logged in hub records.
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onReturnHome}
          className="w-full py-2.5 items-center justify-center"
        >
          <Text className="text-[13px] font-bold text-[#475569]">
            Return to Home
          </Text>
        </TouchableOpacity>
      </View>

      {/* Proof of Delivery Photo Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={isPodModalOpen}
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Backdrop tap to dismiss */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              if (currentScale.current <= 1.05) {
                handleClose();
              } else {
                animateTo(1);
              }
            }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Floating Close Button Top-Right */}
          <SafeAreaView
            pointerEvents="box-none"
            style={{ position: 'absolute', top: 12, right: 16, zIndex: 30 }}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }}
              accessibilityLabel="Close Proof of Delivery"
            >
              <X size={20} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Interactable Zoomable Photo */}
          <Animated.View
            {...panResponder.panHandlers}
            style={{
              zIndex: 20,
              transform: [
                { translateX: pan.x },
                { translateY: pan.y },
                { scale: scale },
              ],
            }}
          >
            <Image
              source={hasRemoteProof ? { uri: order.proofImageUrl! } : sampleWaybill}
              style={{
                width: imageWidth,
                height: imageHeight,
                borderRadius: 16,
              }}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Floating Zoom Controls Bar */}
          <View
            style={{
              position: 'absolute',
              bottom: 36,
              zIndex: 30,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.15)',
              gap: 12,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => animateTo(currentScale.current - 0.5)}
              disabled={displayScale <= 1}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: displayScale <= 1 ? 0.35 : 1,
              }}
              accessibilityLabel="Zoom Out"
            >
              <Minus size={16} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => animateTo(1)}
              style={{ paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' }}
              accessibilityLabel="Reset Zoom"
            >
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                {displayScale}x {displayScale > 1 ? '(Reset)' : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => animateTo(currentScale.current + 0.5)}
              disabled={displayScale >= 4}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: displayScale >= 4 ? 0.35 : 1,
              }}
              accessibilityLabel="Zoom In"
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
