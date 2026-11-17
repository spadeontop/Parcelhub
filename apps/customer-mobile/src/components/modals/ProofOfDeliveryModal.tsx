import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Modal,
  Image,
  Animated,
  PanResponder,
  useWindowDimensions,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { useV1 } from '../../v1/context/V1Context';
import { orderApi } from '../../v1/services/orderApi';
import { v1Storage } from '../../v1/utils/storage';
import { CloseIcon } from '../common/Icons';

export const ProofOfDeliveryModal: React.FC = () => {
  const { isPodModalOpen: legacyIsOpen, closePodModal: legacyClose, getCurrentOrder } = useApp();
  const {
    isPodModalOpen: v1IsOpen,
    closePodModal: v1Close,
    selectedOrderId,
    orders,
    authToken,
  } = useV1();

  const isOpen = v1IsOpen || legacyIsOpen;
  const closeModal = v1IsOpen ? v1Close : legacyClose;

  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const currentV1Order = orders.find(
    (o) => o.id === selectedOrderId || o.ticketCode === selectedOrderId
  );
  const legacyOrder = getCurrentOrder();
  const trackingNumber = currentV1Order?.trackingId || legacyOrder?.trackingNumber || '—';

  const [proofPhotoUrl, setProofPhotoUrl] = useState<string | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(false);

  // Zoom and pan state
  const [displayScale, setDisplayScale] = useState<number>(1);
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const currentScale = useRef<number>(1);
  const currentPan = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialDistance = useRef<number | null>(null);
  const initialScale = useRef<number>(1);
  const lastTap = useRef<number>(0);

  // Layout sizing
  const topBarHeight = Math.max(insets.top, 16) + 52;
  const bottomBarHeight = Math.max(insets.bottom, 20) + 56;
  const availableHeight = windowHeight - topBarHeight - bottomBarHeight;

  const imageWidth = Math.min(windowWidth - 24, 460);
  const imageHeight = Math.min(availableHeight - 20, 560);

  // Listeners for synchronous gesture calculations
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

  // Reset zoom & pan helper
  const resetZoom = () => {
    scale.setValue(1);
    pan.setValue({ x: 0, y: 0 });
    pan.setOffset({ x: 0, y: 0 });
    currentScale.current = 1;
    currentPan.current = { x: 0, y: 0 };
    setDisplayScale(1);
  };

  const handleClose = () => {
    resetZoom();
    closeModal();
  };

  // Reset zoom whenever modal opens
  useEffect(() => {
    if (isOpen) {
      resetZoom();
    }
  }, [isOpen]);

  // Fetch proof photo when modal opens
  useEffect(() => {
    let isMounted = true;
    if (isOpen && selectedOrderId) {
      setLoadingPhoto(true);
      (async () => {
        try {
          const token = authToken || (await v1Storage.getAuthToken());
          if (!token) return;
          const res = await orderApi.getOrderPhoto(token, selectedOrderId, 'proof');
          if (isMounted && (res.proofImageUrl || res.imageUrl)) {
            setProofPhotoUrl(res.proofImageUrl || res.imageUrl || null);
          }
        } catch {
          // Fallback gracefully: proofPhotoUrl remains null
        } finally {
          if (isMounted) setLoadingPhoto(false);
        }
      })();
    } else if (!isOpen) {
      setProofPhotoUrl(null);
      setImageLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedOrderId, authToken]);

  // Smooth animation to target scale
  const animateTo = (targetScale: number) => {
    const clampedScale = Math.max(1, Math.min(targetScale, 4));
    setDisplayScale(Number(clampedScale.toFixed(1)));
    if (clampedScale === 1) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 40,
          friction: 7,
        }),
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          tension: 40,
          friction: 7,
        }),
      ]).start(() => {
        currentScale.current = 1;
        currentPan.current = { x: 0, y: 0 };
        pan.setOffset({ x: 0, y: 0 });
        pan.setValue({ x: 0, y: 0 });
      });
    } else {
      Animated.spring(scale, {
        toValue: clampedScale,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }).start(() => {
        currentScale.current = clampedScale;
      });
    }
  };

  const calcDistance = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Pan responder for double-click/double-tap zoom, pinch-to-zoom, and dragging
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
          // Double-click / double-tap detection (< 300ms)
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
              tension: 40,
              friction: 7,
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

  if (!isOpen) return null;

  const hasRemoteProof = Boolean(
    proofPhotoUrl &&
      (proofPhotoUrl.startsWith('http://') ||
        proofPhotoUrl.startsWith('https://') ||
        proofPhotoUrl.startsWith('data:') ||
        proofPhotoUrl.startsWith('file://'))
  );

  return (
    <Modal
      transparent
      animationType="fade"
      visible={isOpen}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* SAFE AREA ABOVE: When pressed, it disables the modal */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleClose}
          accessibilityLabel="Close modal"
          accessibilityRole="button"
          style={[
            styles.safeAreaAbove,
            {
              paddingTop: Math.max(insets.top, 16),
            },
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                Proof of Delivery
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {trackingNumber !== '—' ? `Tracking: ${trackingNumber}` : 'Delivery Verification Photo'}
              </Text>
            </View>
            <View style={styles.closeButtonCircle}>
              <CloseIcon size={18} color="#FFFFFF" />
            </View>
          </View>
        </TouchableOpacity>

        {/* MIDDLE IMAGE AREA */}
        <View style={styles.imageViewerArea}>
          {/* Backdrop press: tapping outside image dismisses or resets zoom */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (currentScale.current > 1.05) {
                animateTo(1);
              } else {
                handleClose();
              }
            }}
          />

          {/* Loading spinner: shown without any placeholder image behind it */}
          {loadingPhoto ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#38bdf8" />
              <Text style={styles.loadingText}>
                Loading verification photo...
              </Text>
            </View>
          ) : hasRemoteProof ? (
            <>
              {/* Interactable Zoomable Image Container */}
              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  styles.imageAnimatedWrapper,
                  {
                    width: imageWidth,
                    height: imageHeight,
                    transform: [
                      { translateX: pan.x },
                      { translateY: pan.y },
                      { scale: scale },
                    ],
                  },
                ]}
              >
                <Image
                  source={{ uri: proofPhotoUrl! }}
                  style={styles.image}
                  resizeMode="contain"
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                />
              </Animated.View>

              {/* Spinner while image data is being downloaded by Image component */}
              {imageLoading && (
                <View pointerEvents="none" style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#38bdf8" />
                  <Text style={styles.loadingText}>
                    Loading verification photo...
                  </Text>
                </View>
              )}

              {/* Floating hint pill */}
              <View pointerEvents="none" style={styles.floatingHintPill}>
                <Text style={styles.floatingHintText}>
                  {displayScale > 1.05
                    ? `${displayScale}x • Double-tap to reset`
                    : 'Double-tap image to zoom'}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>
                No verification photo available for this order.
              </Text>
            </View>
          )}
        </View>

        {/* SAFE AREA IN THE BOTTOM: When pressed, it disables the modal */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleClose}
          accessibilityLabel="Close modal"
          accessibilityRole="button"
          style={[
            styles.safeAreaBottom,
            {
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          <View style={styles.bottomPill}>
            <CloseIcon size={16} color="#FFFFFF" />
            <Text style={styles.bottomPillText}>
              Tap safe area to close
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
  },
  safeAreaAbove: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingBottom: 12,
    paddingHorizontal: 20,
    zIndex: 30,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '400',
  },
  closeButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  imageViewerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  imageAnimatedWrapper: {
    zIndex: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  floatingHintPill: {
    position: 'absolute',
    bottom: 14,
    zIndex: 25,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  floatingHintText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 26,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  safeAreaBottom: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingTop: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  bottomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    gap: 8,
  },
  bottomPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ProofOfDeliveryModal;
