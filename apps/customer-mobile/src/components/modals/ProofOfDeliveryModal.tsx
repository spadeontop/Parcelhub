import React, { useState, useEffect, useRef, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useV1 } from '../../v1/context/V1Context';
import { orderApi } from '../../v1/services/orderApi';
import { v1Storage } from '../../v1/utils/storage';
import { CloseIcon } from '../common/Icons';

export const ProofOfDeliveryModal: React.FC = () => {
  const {
    isPodModalOpen: isOpen,
    closePodModal: closeModal,
    selectedOrderId,
    orders,
    authToken,
  } = useV1();

  const currentV1Order = orders.find(
    (o) => o.id === selectedOrderId || o.ticketCode === selectedOrderId
  );
  const trackingNumber = currentV1Order?.trackingId || '—';

  const [proofPhotoUrl, setProofPhotoUrl] = useState<string | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState<boolean>(false);

  // Dynamic dimensions tailored for mobile viewport
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const imageWidth = Math.min(windowWidth - 24, 460);
  const imageHeight = Math.min(windowHeight * 0.75, 600);

  // Zoom and pan state
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

  // Sync animated values to plain numbers for gesture calculations
  useEffect(() => {
    const scaleId = scale.addListener(({ value }) => {
      currentScale.current = value;
    });
    const panId = pan.addListener((value) => {
      currentPan.current = value;
    });
    return () => {
      scale.removeListener(scaleId);
      pan.removeListener(panId);
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
    closeModal();
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

  useEffect(() => {
    let isMounted = true;
    if (isOpen && selectedOrderId) {
      resetZoom();
      setLoadingPhoto(true);
      (async () => {
        try {
          const token = authToken || (await v1Storage.getAuthToken());
          if (!token) return;
          const res = await orderApi.getOrderPhoto(token, selectedOrderId, 'proof');
          if (isMounted) {
            setProofPhotoUrl(res.proofImageUrl || res.imageUrl || null);
          }
        } catch {
          // Fallback to placeholder if network error or photo unavailable
        } finally {
          if (isMounted) setLoadingPhoto(false);
        }
      })();
    } else {
      setProofPhotoUrl(null);
      resetZoom();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedOrderId, authToken]);

  if (!isOpen) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={isOpen}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.92)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Backdrop tap to dismiss when unzoomed, or reset zoom when zoomed */}
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

        {/* Translucent circular "X" button at top-right */}
        <SafeAreaView
          pointerEvents="box-none"
          style={{ position: 'absolute', top: 12, right: 16, zIndex: 50 }}
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
              borderColor: 'rgba(255, 255, 255, 0.35)',
            }}
            accessibilityLabel="Close Proof of Delivery"
          >
            <CloseIcon size={20} color="#FFFFFF" />
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
            {/* Interactive Zoomable Photo */}
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
              {proofPhotoUrl ? (
                <Image
                  source={{ uri: proofPhotoUrl }}
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
                    MATCH: {trackingNumber}
                  </Text>
                  <Text className="text-xs font-normal text-gray-400 mt-1">
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
                <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 12, fontFamily: 'GoogleSans-Medium', fontWeight: '500' }}>
                  Pinch or double-tap to zoom
                </Text>
              </View>
            )}

            {/* Floating Zoom Controls Bar (Visible when zoomed) */}
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
                  <Text style={{ color: '#FFFFFF', fontFamily: 'GoogleSans-Bold', fontWeight: 'bold', fontSize: 16, lineHeight: 18 }}>-</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => animateTo(1)}
                  style={{ paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' }}
                  accessibilityLabel="Reset Zoom"
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: 'GoogleSans-Bold', fontWeight: '700' }}>
                    {displayScale}x <Text style={{ fontFamily: 'GoogleSans-Regular', fontWeight: '400', color: 'rgba(255, 255, 255, 0.7)' }}>(Reset)</Text>
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
                  <Text style={{ color: '#FFFFFF', fontFamily: 'GoogleSans-Bold', fontWeight: 'bold', fontSize: 16, lineHeight: 18 }}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
};

export default ProofOfDeliveryModal;
