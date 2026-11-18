import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

interface StaffOrderCardSkeletonProps {
  count?: number;
}

export const StaffOrderCardSkeleton: React.FC<StaffOrderCardSkeletonProps> = ({
  count = 5,
}) => {
  const opacityAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacityAnim]);

  return (
    <View className="py-0.5">
      {Array.from({ length: count }).map((_, idx) => (
        <View key={idx} className="py-2.5">
          {/* Top Row: Order ID + Status badge placeholder */}
          <View className="flex-row items-center justify-between">
            <Animated.View
              style={{ opacity: opacityAnim }}
              className="w-24 h-3 bg-slate-200 rounded"
            />
            <Animated.View
              style={{ opacity: opacityAnim }}
              className="w-16 h-4 bg-slate-200 rounded-full"
            />
          </View>

          {/* Middle Row: Customer name placeholder */}
          <Animated.View
            style={{ opacity: opacityAnim }}
            className="w-36 h-3.5 bg-slate-200 rounded mt-2"
          />

          {/* Bottom Row: Date + Price placeholder */}
          <View className="flex-row items-center justify-between mt-2">
            <Animated.View
              style={{ opacity: opacityAnim }}
              className="w-20 h-2.5 bg-slate-100 rounded"
            />
            <Animated.View
              style={{ opacity: opacityAnim }}
              className="w-12 h-3 bg-slate-100 rounded"
            />
          </View>

          {/* Item Divider */}
          {idx < count - 1 && <View className="h-px bg-[#F1F5F9] mt-2.5" />}
        </View>
      ))}
    </View>
  );
};
