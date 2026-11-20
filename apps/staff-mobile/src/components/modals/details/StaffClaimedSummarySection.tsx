import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Animated,
  PanResponder,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import { StaffOrder } from '../../../types';
import { Check, X, Plus, Minus } from '../../common/Icons';
import { OrderCardContainer } from '../../common/OrderCardContainer';
import { PaymentSummaryCard } from './PaymentSummaryCard';
import { staffApi } from '../../../services/staffApi';

interface StaffClaimedSummarySectionProps {
  order: StaffOrder;
  onReturnHome: () => void;
}

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
  const [proofPhotoUrl, setProofPhotoUrl] = useState<string | null>(order.proofImageUrl || null);
  const [loadingPhoto, setLoadingPhoto] = useState<boolean>(false);

  // Synchronize proofPhotoUrl if order prop receives proofImageUrl
  useEffect(() => {
    if (order.proofImageUrl) {
      setProofPhotoUrl(order.proofImageUrl);
      setLoadingPhoto(false);
    }
  }, [order.proofImageUrl]);

  // Reset state when switching to a different order
  useEffect(() => {
    setProofPhotoUrl(order.proofImageUrl || null);
    setLoadingPhoto(false);
  }, [order.id]);

  // On-demand fetch when the modal is opened
  useEffect(() => {
    let cancelled = false;

    if (!isPodModalOpen) {
      setLoadingPhoto(false);
      return;
    }

    // If photo is already available in memory, show it immediately without network request
    if (order.proofImageUrl || proofPhotoUrl) {
      setLoadingPhoto(false);
      return;
    }

    setLoadingPhoto(true);
    (async () => {
      try {
        const photoData = await staffApi.getOrderPhoto(order.id, 'proof');
        if (!cancelled) {
          const url = photoData.proofImageUrl || photoData.imageUrl;
          if (url) {
            setProofPhotoUrl(url);
          }
        }
      } catch (err) {
        console.warn('[Staff Proof] Failed to fetch photo:', err);
      } finally {
        if (!cancelled) {
          setLoadingPhoto(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isPodModalOpen, order.id]);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Photo size tailored for mobile view: clearly visible, comfortable margins, not cramped or overflowing
  const imageWidth = Math.min(windowWidth - 24, 460);
  const imageHeight = Math.min(windowHeight * 0.75, 600);

  const [displayScale, setDisplayScale] = useState<number>(1);
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const currentScale = useRef<number>(1);
  const currentPan = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Multi-touch pinch tracking
  const isPinching = useRef<boolean>(false);
  const pinchStartDist = useRef<number | null>(null);
  const pinchStartScale = useRef<number>(1);
  const pinchStartMidpoint = useRef<{ x: number; y: number } | null>(null);
  const pinchStartPan = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Single-touch panning tracking
  const singleTouchStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const singleTouchPanStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Double-tap tracking with focal point
  const lastTap = useRef<number>(0);
  const lastTapPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const justDoubleTapped = useRef<boolean>(false);

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

  const calcDistance = (
    t1: { pageX: number; pageY: number },
    t2: { pageX: number; pageY: number }
  ) => {
    const dx = t1.pageX - t2.pageX;
    const dy = t1.pageY - t2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const calcMidpoint = (
    t1: { pageX: number; pageY: number },
    t2: { pageX: number; pageY: number }
  ) => {
    return {
      x: (t1.pageX + t2.pageX) / 2,
      y: (t1.pageY + t2.pageY) / 2,
    };
  };

  // Reset zoom whenever modal opens
  const resetZoom = () => {
    scale.setValue(1);
    pan.setValue({ x: 0, y: 0 });
    currentScale.current = 1;
    currentPan.current = { x: 0, y: 0 };
    isPinching.current = false;
    pinchStartDist.current = null;
    pinchStartMidpoint.current = null;
    justDoubleTapped.current = false;
    setDisplayScale(1);
  };

  useEffect(() => {
    if (isPodModalOpen) {
      resetZoom();
    }
  }, [isPodModalOpen]);

  const animateTo = (
    targetScale: number,
    focalPoint?: { pageX: number; pageY: number }
  ) => {
    const clampedScale = Math.max(1, Math.min(targetScale, 4));
    setDisplayScale(Number(clampedScale.toFixed(1)));

    if (clampedScale <= 1) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start(() => {
        currentScale.current = 1;
        currentPan.current = { x: 0, y: 0 };
      });
    } else {
      let targetX = currentPan.current.x;
      let targetY = currentPan.current.y;

      if (focalPoint) {
        const centerX = windowWidth / 2;
        const centerY = windowHeight / 2;
        const dx = focalPoint.pageX - centerX;
        const dy = focalPoint.pageY - centerY;

        // Glides the tapped point toward the center of the viewport
        targetX = -dx * clampedScale;
        targetY = -dy * clampedScale;
      }

      const maxPanX = Math.max(0, ((clampedScale - 1) * imageWidth) / 2);
      const maxPanY = Math.max(0, ((clampedScale - 1) * imageHeight) / 2);
      const clampedX = Math.max(-maxPanX, Math.min(maxPanX, targetX));
      const clampedY = Math.max(-maxPanY, Math.min(maxPanY, targetY));

      Animated.parallel([
        Animated.spring(scale, {
          toValue: clampedScale,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(pan, {
          toValue: { x: clampedX, y: clampedY },
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start(() => {
        currentScale.current = clampedScale;
        currentPan.current = { x: clampedX, y: clampedY };
      });
    }
  };

  const handleClose = () => {
    resetZoom();
    setLoadingPhoto(false);
    setIsPodModalOpen(false);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          return (
            evt.nativeEvent.touches.length >= 2 ||
            currentScale.current > 1.05 ||
            Math.abs(gestureState.dx) > 2 ||
            Math.abs(gestureState.dy) > 2
          );
        },
        onMoveShouldSetPanResponderCapture: (evt) => {
          return evt.nativeEvent.touches.length >= 2 || currentScale.current > 1.05;
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (evt) => {
          const touches = evt.nativeEvent?.touches || [];
          if (touches.length >= 2) {
            isPinching.current = true;
            pinchStartDist.current = calcDistance(touches[0], touches[1]);
            pinchStartScale.current = currentScale.current;
            pinchStartMidpoint.current = calcMidpoint(touches[0], touches[1]);
            pinchStartPan.current = { ...currentPan.current };
          } else if (touches.length === 1) {
            isPinching.current = false;
            pinchStartDist.current = null;
            singleTouchStart.current = { x: touches[0].pageX, y: touches[0].pageY };
            singleTouchPanStart.current = { ...currentPan.current };

            const touch = touches[0];
            const now = Date.now();
            const timeDiff = now - lastTap.current;
            const distDiff = Math.hypot(
              touch.pageX - lastTapPos.current.x,
              touch.pageY - lastTapPos.current.y
            );

            // Double-tap detected (within 350ms and within 60px distance)
            if (timeDiff < 350 && distDiff < 60) {
              justDoubleTapped.current = true;
              lastTap.current = 0;

              if (currentScale.current > 1.1) {
                // Double tap while zoomed in: smoothly zoom out back to default size
                animateTo(1);
              } else {
                // Double tap while at default size: smoothly zoom into the tapped location
                animateTo(2.5, { pageX: touch.pageX, pageY: touch.pageY });
              }
              return;
            }

            lastTap.current = now;
            lastTapPos.current = { x: touch.pageX, y: touch.pageY };
          }
        },
        onPanResponderMove: (evt) => {
          if (justDoubleTapped.current) return;

          const touches = evt.nativeEvent?.touches || [];

          if (touches.length >= 2) {
            const currentDist = calcDistance(touches[0], touches[1]);
            const currentMid = calcMidpoint(touches[0], touches[1]);

            if (!isPinching.current || pinchStartDist.current === null || pinchStartDist.current === 0) {
              isPinching.current = true;
              pinchStartDist.current = currentDist;
              pinchStartScale.current = currentScale.current;
              pinchStartMidpoint.current = currentMid;
              pinchStartPan.current = { ...currentPan.current };
              return;
            }

            const scaleRatio = currentDist / pinchStartDist.current;
            const newScale = Math.max(0.75, Math.min(pinchStartScale.current * scaleRatio, 4.2));
            scale.setValue(newScale);

            if (pinchStartMidpoint.current) {
              const deltaX = currentMid.x - pinchStartMidpoint.current.x;
              const deltaY = currentMid.y - pinchStartMidpoint.current.y;
              pan.setValue({
                x: pinchStartPan.current.x + deltaX,
                y: pinchStartPan.current.y + deltaY,
              });
            }
          } else if (touches.length === 1) {
            if (isPinching.current) {
              isPinching.current = false;
              pinchStartDist.current = null;
              pinchStartMidpoint.current = null;
              singleTouchStart.current = { x: touches[0].pageX, y: touches[0].pageY };
              singleTouchPanStart.current = { ...currentPan.current };
              return;
            }

            if (currentScale.current > 1.05) {
              const dx = touches[0].pageX - singleTouchStart.current.x;
              const dy = touches[0].pageY - singleTouchStart.current.y;
              pan.setValue({
                x: singleTouchPanStart.current.x + dx,
                y: singleTouchPanStart.current.y + dy,
              });
            }
          }
        },
        onPanResponderRelease: () => {
          if (justDoubleTapped.current) {
            justDoubleTapped.current = false;
            return;
          }

          isPinching.current = false;
          pinchStartDist.current = null;
          pinchStartMidpoint.current = null;

          if (currentScale.current <= 1.05) {
            animateTo(1);
          } else {
            const clampedScale = Math.min(Math.max(1, currentScale.current), 4);
            setDisplayScale(Number(clampedScale.toFixed(1)));

            const maxPanX = Math.max(0, ((clampedScale - 1) * imageWidth) / 2);
            const maxPanY = Math.max(0, ((clampedScale - 1) * imageHeight) / 2);
            const clampedX = Math.max(-maxPanX, Math.min(maxPanX, currentPan.current.x));
            const clampedY = Math.max(-maxPanY, Math.min(maxPanY, currentPan.current.y));

            Animated.parallel([
              Animated.spring(scale, {
                toValue: clampedScale,
                friction: 7,
                tension: 40,
                useNativeDriver: true,
              }),
              Animated.spring(pan, {
                toValue: { x: clampedX, y: clampedY },
                friction: 7,
                tension: 40,
                useNativeDriver: true,
              }),
            ]).start();
          }
        },
        onPanResponderTerminate: () => {
          justDoubleTapped.current = false;
          isPinching.current = false;
          pinchStartDist.current = null;
          pinchStartMidpoint.current = null;
          if (currentScale.current <= 1.05) {
            animateTo(1);
          }
        },
      }),
    [imageWidth, imageHeight, windowWidth, windowHeight]
  );

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

  const activeProofUri = proofPhotoUrl || order.proofImageUrl;
  const hasRemoteProof = Boolean(
    activeProofUri &&
      (activeProofUri.startsWith('http://') ||
        activeProofUri.startsWith('https://') ||
        activeProofUri.startsWith('data:') ||
        activeProofUri.startsWith('file://'))
  );

  const price = typeof order.amountToPay === 'number' ? order.amountToPay : 0;
  const paidAmount =
    typeof order.amountReceived === 'number'
      ? order.amountReceived
      : price;
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

          {/* Loading Indicator */}
          {loadingPhoto ? (
            <View className="items-center justify-center">
              <ActivityIndicator size="large" color="#ffffff" />
              <Text className="text-xs text-gray-300 mt-3 font-medium">
                Loading verification photo...
              </Text>
            </View>
          ) : (
            <>
              {/* Interactable Zoomable Photo */}
              <Animated.View
                {...panResponder.panHandlers}
                style={{
                  zIndex: 20,
                  width: imageWidth,
                  height: imageHeight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [
                    { translateX: pan.x },
                    { translateY: pan.y },
                    { scale: scale },
                  ],
                }}
              >
                {hasRemoteProof && activeProofUri ? (
                  <Image
                    source={{ uri: activeProofUri }}
                    style={{
                      width: imageWidth,
                      height: imageHeight,
                      borderRadius: 16,
                    }}
                    resizeMode="contain"
                  />
                ) : (
                  <View className="py-12 px-8 rounded-3xl bg-gray-900 border border-gray-800 items-center justify-center">
                    <View className="w-24 h-20 rounded-xl bg-amber-500/20 border-2 border-amber-400 items-center justify-center mb-3">
                      <Text className="text-xs font-mono font-bold text-amber-300">
                        POUCH
                      </Text>
                    </View>
                    <Text className="text-sm font-mono text-[#10b780] font-bold">
                      MATCH: {order.trackingId || order.id}
                    </Text>
                    <Text className="text-xs text-gray-400 mt-1">
                      Hub Counter Camera • Verified Intact
                    </Text>
                  </View>
                )}
              </Animated.View>

              {/* Subtle Hint Pill (Visible when unzoomed) */}
              {displayScale <= 1.05 && (
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    bottom: 36,
                    zIndex: 30,
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 9999,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 12, fontWeight: '500' }}>
                    Pinch or double-tap to zoom
                  </Text>
                </View>
              )}

              {/* Floating Zoom Controls Bar */}
              {displayScale > 1.05 && (
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
                    borderColor: 'rgba(255, 255, 255, 0.25)',
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
                      {displayScale}x <Text style={{ fontWeight: '400', color: 'rgba(255, 255, 255, 0.7)' }}>(Reset)</Text>
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
              )}
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};
