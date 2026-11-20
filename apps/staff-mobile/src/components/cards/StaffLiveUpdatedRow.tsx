import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';
import { StaffOrder, OrderStatus } from '../../types';
import { StaffBadge } from '../common/StaffBadge';

interface StaffLiveUpdatedRowProps {
  order: StaffOrder;
  actionBadgeText: string;
  targetBadgeText: string;
  targetStatus: OrderStatus;
  onPress: (order: StaffOrder) => void;
  onAnimationComplete?: () => void;
  showDivider?: boolean;
}

const customBezier = Easing.bezier(0.22, 1, 0.36, 1);

export const StaffLiveUpdatedRow: React.FC<StaffLiveUpdatedRowProps> = ({
  order,
  actionBadgeText,
  targetBadgeText,
  targetStatus,
  onPress,
  onAnimationComplete,
  showDivider = true,
}) => {
  // 1. Surface highlight cycle: 4.5s
  const surfaceAnim = useRef(new Animated.Value(0)).current;

  // 2. Shimmer sweep: 1.2s with 0.2s delay
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // 3. Badges cycle: 4.5s (longer, clear status animation)
  const badgeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start surface highlight animation (4.5s)
    Animated.timing(surfaceAnim, {
      toValue: 1,
      duration: 4500,
      easing: customBezier,
      useNativeDriver: false,
    }).start();

    // Start shimmer sweep (1.2s, delay 200ms)
    Animated.timing(shimmerAnim, {
      toValue: 1,
      duration: 1200,
      delay: 200,
      easing: customBezier,
      useNativeDriver: true,
    }).start();

    // Start badge cycle animation (4.5s)
    Animated.timing(badgeAnim, {
      toValue: 1,
      duration: 4500,
      easing: customBezier,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && onAnimationComplete) {
        onAnimationComplete();
      }
    });
  }, []);

  const formattedDate = (() => {
    const raw = order.timestamp || order.createdAt;
    if (!raw) return 'October 18, 2026';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return 'October 18, 2026';
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  })();

  const orderTicket = order.ticketCode || order.id || order.trackingId;
  const customerName = order.customer || 'Customer';
  const amountStr = `₱${order.amountToPay.toLocaleString()}`;

  // Background color cycle (4.5s total)
  const backgroundColor = surfaceAnim.interpolate({
    inputRange: [0, 0.1, 0.68, 1],
    outputRange: ['#d1fae5', '#ecfdf5', '#ecfdf5', '#ffffff'],
  });

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-350, 450],
  });

  // Phase 1 Badge: "Activated" / "Proof Attached" / "Released"
  // Pops in, holds clearly for ~2.8s (much longer), then smoothly floats up & exits
  const phase1Opacity = badgeAnim.interpolate({
    inputRange: [0, 0.05, 0.08, 0.62, 0.74, 1],
    outputRange: [0, 1, 1, 1, 0, 0],
  });

  const phase1Scale = badgeAnim.interpolate({
    inputRange: [0, 0.05, 0.08, 0.62, 0.74, 1],
    outputRange: [0.8, 1.05, 1, 1, 0.9, 0.9],
  });

  const phase1TranslateY = badgeAnim.interpolate({
    inputRange: [0, 0.62, 0.74, 1],
    outputRange: [0, 0, -4, -4],
  });

  // Phase 2 Badge: Permanent Target Badge
  // Morphs in from ~3.0s and settles permanently
  const phase2Opacity = badgeAnim.interpolate({
    inputRange: [0, 0.68, 0.8, 1],
    outputRange: [0, 0, 1, 1],
  });

  const phase2Scale = badgeAnim.interpolate({
    inputRange: [0, 0.68, 0.8, 1],
    outputRange: [0.9, 0.9, 1, 1],
  });

  const phase2TranslateY = badgeAnim.interpolate({
    inputRange: [0, 0.68, 0.8, 1],
    outputRange: [4, 4, 0, 0],
  });

  return (
    <View style={{ width: '100%' }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress(order)}
      >
        {/* Rendered directly at natural full size — no height resizing or squishing */}
        <Animated.View
          style={{
            backgroundColor,
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 10,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Shimmer Overlay */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                transform: [{ translateX: shimmerTranslateX }],
                width: 350,
                zIndex: 10,
              },
            ]}
          >
            <Svg width={350} height={120}>
              <Defs>
                <LinearGradient id="rowShimmerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#10B981" stopOpacity="0" />
                  <Stop offset="50%" stopColor="#10B981" stopOpacity="0.18" />
                  <Stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width={350} height={120} fill="url(#rowShimmerGrad)" />
            </Svg>
          </Animated.View>

          {/* Top Row: Order ID + Stacked Morphing Badges */}
          <View className="flex-row items-center justify-between">
            <Text className="text-[10px] font-semibold text-[#2563EB]">
              {orderTicket}
            </Text>

            {/* Stacked Morphing Badges Container */}
            <View className="relative h-6 items-end justify-center min-w-[110px]">
              {/* Phase 1 Pill: Green pop-in with SVG Checkmark */}
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  right: 0,
                  opacity: phase1Opacity,
                  transform: [
                    { scale: phase1Scale },
                    { translateY: phase1TranslateY },
                  ],
                }}
              >
                <View className="flex-row items-center gap-1 bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full">
                  <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M4.5 12.75l6 6 9-13.5"
                      stroke="#059669"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text className="text-[10px] font-bold text-[#047857]">
                    {actionBadgeText}
                  </Text>
                </View>
              </Animated.View>

              {/* Phase 2 Pill: Permanent Target Badge */}
              <Animated.View
                style={{
                  position: 'absolute',
                  right: 0,
                  opacity: phase2Opacity,
                  transform: [
                    { scale: phase2Scale },
                    { translateY: phase2TranslateY },
                  ],
                }}
              >
                <StaffBadge status={targetStatus} />
              </Animated.View>
            </View>
          </View>

          {/* Middle Row: Customer name (generous line-height so descenders are never clipped) */}
          <Text
            className="text-[12px] font-semibold text-[#1E293B] leading-[18px] mt-1 mb-0.5"
            numberOfLines={1}
          >
            {customerName}
          </Text>

          {/* Bottom Row: Date + Price */}
          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-[10px] font-normal text-[#64748B]">
              {formattedDate}
            </Text>
            <Text className="text-[11px] font-semibold text-[#334155]">
              {amountStr}
            </Text>
          </View>

          {/* Item Divider */}
          {showDivider && <View className="h-px bg-[#F1F5F9] mt-2.5" />}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};
