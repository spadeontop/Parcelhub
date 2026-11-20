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
const ROW_HEIGHT = 91;

export const StaffLiveUpdatedRow: React.FC<StaffLiveUpdatedRowProps> = ({
  order,
  actionBadgeText,
  targetBadgeText,
  targetStatus,
  onPress,
  onAnimationComplete,
  showDivider = true,
}) => {
  // 1. Top-row expansion: 0fr to 1fr (450ms) pushing existing rows down smoothly
  const insertHeight = useRef(new Animated.Value(0)).current;

  // 2. Full-width subtle emerald tint & morph cycle: 2.8s total (2s hold, then smooth cross-fade)
  const animCycle = useRef(new Animated.Value(0)).current;

  // 3. Shimmer sweep: 1.1s with 0.15s delay
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Smooth 450ms row expansion gently pushing down existing rows
    Animated.timing(insertHeight, {
      toValue: 1,
      duration: 450,
      easing: customBezier,
      useNativeDriver: false,
    }).start();

    // 2. Subtle shimmer sweep
    Animated.timing(shimmerAnim, {
      toValue: 1,
      duration: 1100,
      delay: 150,
      easing: customBezier,
      useNativeDriver: true,
    }).start();

    // 3. 2.8s total cycle: 2s hold in subtle emerald tint & Phase 1 badge, then smooth cross-fade to white & target status
    Animated.timing(animCycle, {
      toValue: 1,
      duration: 2800,
      easing: customBezier,
      useNativeDriver: false,
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

  // 0fr to 1fr row expansion: 0 to 91px over 450ms
  const animatedRowHeight = insertHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, ROW_HEIGHT],
  });

  // Background color: subtle emerald tint (#ECFDF5) for 2 seconds (0 to ~0.71), then smoothly fades to white (#FFFFFF)
  const backgroundColor = animCycle.interpolate({
    inputRange: [0, 0.71, 0.92, 1],
    outputRange: ['#ECFDF5', '#ECFDF5', '#FFFFFF', '#FFFFFF'],
  });

  // Contained top-line highlight along the red line at the top
  const topLineOpacity = animCycle.interpolate({
    inputRange: [0, 0.71, 0.92, 1],
    outputRange: [0.6, 0.6, 0, 0],
  });

  // Subtle Shimmer sweep across the row
  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-350, 450],
  });

  // Phase 1 Badge ("✓ Activated" in green): Holds for 2s, then cross-fades out
  const phase1Opacity = animCycle.interpolate({
    inputRange: [0, 0.08, 0.71, 0.82, 1],
    outputRange: [0, 1, 1, 0, 0],
  });

  const phase1Scale = animCycle.interpolate({
    inputRange: [0, 0.08, 0.71, 0.82, 1],
    outputRange: [0.85, 1, 1, 0.9, 0.9],
  });

  const phase1TranslateY = animCycle.interpolate({
    inputRange: [0, 0.71, 0.82, 1],
    outputRange: [0, 0, -3, -3],
  });

  // Phase 2 Badge (Permanent target status pill e.g. blue "Awaiting Parcel"):
  // Cross-fades in at 2 seconds and settles permanently
  const phase2Opacity = animCycle.interpolate({
    inputRange: [0, 0.71, 0.85, 1],
    outputRange: [0, 0, 1, 1],
  });

  const phase2Scale = animCycle.interpolate({
    inputRange: [0, 0.71, 0.85, 1],
    outputRange: [0.9, 0.9, 1, 1],
  });

  const phase2TranslateY = animCycle.interpolate({
    inputRange: [0, 0.71, 0.85, 1],
    outputRange: [3, 3, 0, 0],
  });

  return (
    <Animated.View
      style={{
        height: animatedRowHeight,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress(order)}
      >
        {/* Inner View: Fixed 91px natural height with px-4 py-3.5 edge-to-edge flush with card container */}
        <Animated.View
          style={{
            backgroundColor,
            paddingHorizontal: 16,
            paddingVertical: 14,
            height: ROW_HEIGHT,
            overflow: 'hidden',
            position: 'relative',
            justifyContent: 'space-between',
          }}
        >
          {/* Contained top-line highlight right along the top curved edge */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              backgroundColor: '#10B981',
              opacity: topLineOpacity,
              zIndex: 15,
            }}
          />

          {/* Shimmer Overlay: subtle sweep across full width */}
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
                  <Stop offset="50%" stopColor="#10B981" stopOpacity="0.12" />
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
              {/* Phase 1 Pill: Green pop-in "✓ Activated" badge for 2s */}
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

              {/* Phase 2 Pill: Permanent Target Status Badge (e.g. blue "Awaiting Parcel") */}
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

          {/* Middle Row: Customer name (clean natural text line-height) */}
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
          {showDivider && <View className="h-px bg-[#F1F5F9] mt-3.5" />}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};
