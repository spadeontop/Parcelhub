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
  // 1. Insert slot expansion: 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease
  const insertHeight = useRef(new Animated.Value(0)).current;
  const insertOpacity = useRef(new Animated.Value(0)).current;

  // 2. Surface highlight cycle: 3s cubic-bezier(0.22, 1, 0.36, 1)
  const surfaceAnim = useRef(new Animated.Value(0)).current;

  // 3. Shimmer sweep: 1.1s cubic-bezier(0.22, 1, 0.36, 1) with 0.2s delay
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // 4. Badges cycle: 3s
  const badgeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start insert slot animation
    Animated.parallel([
      Animated.timing(insertHeight, {
        toValue: 1,
        duration: 550,
        easing: customBezier,
        useNativeDriver: false,
      }),
      Animated.timing(insertOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();

    // Start surface highlight animation (3s)
    Animated.timing(surfaceAnim, {
      toValue: 1,
      duration: 3000,
      easing: customBezier,
      useNativeDriver: false,
    }).start();

    // Start shimmer sweep (1.1s, delay 200ms)
    Animated.timing(shimmerAnim, {
      toValue: 1,
      duration: 1100,
      delay: 200,
      easing: customBezier,
      useNativeDriver: true,
    }).start();

    // Start badge cycle animation (3s)
    Animated.timing(badgeAnim, {
      toValue: 1,
      duration: 3000,
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

  // Interpolations
  const rowHeight = insertHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  const backgroundColor = surfaceAnim.interpolate({
    inputRange: [0, 0.18, 0.68, 1],
    outputRange: ['#d1fae5', '#ecfdf5', '#ecfdf5', '#ffffff'],
  });

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 400],
  });

  // Phase 1 Badge: "Activated" / "Proof Attached" / "Released"
  const phase1Opacity = badgeAnim.interpolate({
    inputRange: [0, 0.12, 0.18, 0.68, 0.78, 1],
    outputRange: [0, 1, 1, 1, 0, 0],
  });

  const phase1Scale = badgeAnim.interpolate({
    inputRange: [0, 0.12, 0.18, 0.68, 0.78, 1],
    outputRange: [0.75, 1.06, 1, 1, 0.85, 0.85],
  });

  const phase1TranslateY = badgeAnim.interpolate({
    inputRange: [0, 0.68, 0.78, 1],
    outputRange: [0, 0, -3, -3],
  });

  // Phase 2 Badge: Permanent Target Badge
  const phase2Opacity = badgeAnim.interpolate({
    inputRange: [0, 0.72, 0.84, 1],
    outputRange: [0, 0, 1, 1],
  });

  const phase2Scale = badgeAnim.interpolate({
    inputRange: [0, 0.72, 0.84, 1],
    outputRange: [0.85, 0.85, 1, 1],
  });

  const phase2TranslateY = badgeAnim.interpolate({
    inputRange: [0, 0.72, 0.84, 1],
    outputRange: [3, 3, 0, 0],
  });

  return (
    <Animated.View
      style={{
        maxHeight: rowHeight,
        opacity: insertOpacity,
        overflow: 'hidden',
      }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress(order)}
      >
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
          {/* Shimmer Overlay: subtle sweep from left to right */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                transform: [{ translateX: shimmerTranslateX }],
                width: 300,
                zIndex: 10,
              },
            ]}
          >
            <Svg width={300} height={100}>
              <Defs>
                <LinearGradient id="rowShimmerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#10B981" stopOpacity="0" />
                  <Stop offset="50%" stopColor="#10B981" stopOpacity="0.18" />
                  <Stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width={300} height={100} fill="url(#rowShimmerGrad)" />
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

          {/* Middle Row: Customer name */}
          <Text
            className="text-[12px] font-semibold text-[#1E293B] leading-[17px] mt-0.5"
            numberOfLines={1}
          >
            {customerName}
          </Text>

          {/* Bottom Row: Date + Price */}
          <View className="flex-row items-center justify-between mt-0.5">
            <Text className="text-[10px] font-normal text-[#64748B]">
              {formattedDate}
            </Text>
            <Text className="text-[11px] font-semibold text-[#334155]">
              {amountStr}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Item Divider */}
      {showDivider && <View className="h-px bg-[#F1F5F9] my-1" />}
    </Animated.View>
  );
};
