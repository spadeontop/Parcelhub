import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface ShimmerBoxProps {
  className?: string;
  style?: any;
  animatedValue: Animated.Value;
}

const ShimmerBox: React.FC<ShimmerBoxProps> = ({
  className = '',
  style,
  animatedValue,
}) => {
  const [width, setWidth] = useState<number>(150);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== width) {
      setWidth(w);
    }
  };

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 1.5, width * 1.5],
  });

  return (
    <View
      onLayout={onLayout}
      className={`overflow-hidden bg-[#E2E8F0] ${className}`}
      style={[{ position: 'relative', overflow: 'hidden' }, style]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            width: width * 1.5,
            transform: [{ translateX }],
          },
        ]}
      >
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="ph-shimmer-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <Stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.25" />
              <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.7" />
              <Stop offset="75%" stopColor="#FFFFFF" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#ph-shimmer-grad)" />
        </Svg>
      </Animated.View>
    </View>
  );
};

interface StaffOrderCardSkeletonProps {
  count?: number;
}

export const StaffOrderCardSkeleton: React.FC<StaffOrderCardSkeletonProps> = ({
  count = 5,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  return (
    <View className="py-0.5">
      {Array.from({ length: count }).map((_, idx) => (
        <View key={idx} className="py-2.5">
          {/* Top Row: Order ID + Status badge placeholder */}
          <View className="flex-row items-center justify-between">
            <ShimmerBox
              animatedValue={animatedValue}
              className="w-24 h-3.5 rounded"
            />
            <ShimmerBox
              animatedValue={animatedValue}
              className="w-16 h-4 rounded-full"
            />
          </View>

          {/* Middle Row: Customer name placeholder */}
          <ShimmerBox
            animatedValue={animatedValue}
            className="w-36 h-4 rounded mt-2"
          />

          {/* Bottom Row: Date + Price placeholder */}
          <View className="flex-row items-center justify-between mt-2">
            <ShimmerBox
              animatedValue={animatedValue}
              className="w-24 h-3 rounded"
            />
            <ShimmerBox
              animatedValue={animatedValue}
              className="w-14 h-3.5 rounded"
            />
          </View>

          {/* Item Divider */}
          {idx < count - 1 && <View className="h-px bg-[#F1F5F9] mt-2.5" />}
        </View>
      ))}
    </View>
  );
};
