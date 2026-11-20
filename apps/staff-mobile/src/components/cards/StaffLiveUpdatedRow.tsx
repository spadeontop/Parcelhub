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
const ROW_HEIGHT = 93;

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

  // 2. Full-width subtle emerald tint & morph cycle: 4.2s total (3.5s hold, then smooth 500ms cross-fade to white)
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

    // 2. Subtle shimmer sweep during initial emerald highlight
    Animated.timing(shimmerAnim, {
      toValue: 1,
      duration: 1100,
      delay: 150,
      easing: customBezier,
      useNativeDriver: true,
    }).start();

    // 3. 4.2s total cycle: 3.5s hold in subtle emerald tint & Phase 1 badge ("✓ Activated"),
    // then smooth cross-fade to white & target status badge between 3.5s and 4.0s
    Animated.timing(animCycle, {
      toValue: 1,
      duration: 4200,
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

  // 0fr to 1fr row expansion: 0 to 93px over 450ms
  const animatedRowHeight = insertHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, ROW_HEIGHT],
  });

  // Background color: subtle emerald tint (#ECFDF5) held for 3.5s (0 to 0.833), then smoothly fades to white (#FFFFFF)
  const backgroundColor = animCycle.interpolate({
    inputRange: [0, 0.833, 0.95, 1],
    outputRange: ['#ECFDF5', '#ECFDF5', '#FFFFFF', '#FFFFFF'],
  });

  // Subtle Shimmer sweep across the row
  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-350, 450],
  });

  // Phase 1 Badge ("✓ Activated" in green): Holds for 3.5s, then cross-fades out between 3.5s and 4.0s
  const phase1Opacity = animCycle.interpolate({
    inputRange: [0, 0.05, 0.833, 0.95, 1],
    outputRange: [0, 1, 1, 0, 0],
  });

  const phase1Scale = animCycle.interpolate({
    inputRange: [0, 0.05, 0.833, 0.95, 1],
    outputRange: [0.85, 1, 1, 0.9, 0.9],
  });

  const phase1TranslateY = animCycle.interpolate({
    inputRange: [0, 0.833, 0.95, 1],
    outputRange: [0, 0, -3, -3],
  });

  // Phase 2 Badge (Permanent target status pill e.g. blue "Awaiting Parcel"):
  // Cross-fades in at 3.5s, fully visible by 4.0s, settles permanently
  const phase2Opacity = animCycle.interpolate({
    inputRange: [0, 0.833, 0.95, 1],
    outputRange: [0, 0, 1, 1],
  });

  const phase2Scale = animCycle.interpolate({
    inputRange: [0, 0.833, 0.95, 1],
    outputRange: [0.9, 0.9, 1, 1],
  });

  const phase2TranslateY = animCycle.interpolate({
    inputRange: [0, 0.833, 0.95, 1],
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
        {/* Row container: border-b border-slate-100 directly on the outermost edge with ZERO margin/padding below */}
        <Animated.View
          style={{
            backgroundColor,
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 14,
            height: ROW_HEIGHT,
            borderBottomWidth: showDivider ? 1 : 0,
            borderBottomColor: '#F1F5F9',
            overflow: 'hidden',
            position: 'relative',
            justifyContent: 'space-between',
          }}
        >
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
              {/* Phase 1 Pill: Green pop-in "✓ Activated" badge for 3.5s */}
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
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};
