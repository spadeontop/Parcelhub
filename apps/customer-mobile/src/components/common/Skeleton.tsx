import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useState,
} from 'react';
import {
  Animated,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

export type ShimmerTone = 'light' | 'onBrand';

const SHIMMER_TONE_CONFIG: Record<
  ShimmerTone,
  {
    baseColor: string;
    edgeOpacity: string;
    peakOpacity: string;
  }
> = {
  light: {
    baseColor: '#E2E8F0',
    edgeOpacity: '0.25',
    peakOpacity: '0.7',
  },
  onBrand: {
    baseColor: 'rgba(255, 255, 255, 0.18)',
    edgeOpacity: '0.18',
    peakOpacity: '0.42',
  },
};

const SkeletonContext = createContext<Animated.Value | null>(null);

/**
 * Drives a single native-driver shimmer loop shared across skeleton placeholders.
 * Follows the Animated + react-native-svg shimmer architecture used in StaffOrderCardSkeleton.
 */
export function useShimmerAnimation(
  duration = 1600,
  enabled = true
): Animated.Value {
  const [animatedValue] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!enabled) {
      animatedValue.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [animatedValue, duration, enabled]);

  return animatedValue;
}

export interface SkeletonGroupProps {
  children: React.ReactNode;
  duration?: number;
  enabled?: boolean;
}

/**
 * Synchronizes every nested ShimmerBox onto a single shared Animated.Value loop.
 */
export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  children,
  duration = 1600,
  enabled = true,
}) => {
  const animatedValue = useShimmerAnimation(duration, enabled);

  return (
    <SkeletonContext.Provider value={animatedValue}>
      {children}
    </SkeletonContext.Provider>
  );
};

export interface ShimmerBoxProps {
  className?: string;
  style?: StyleProp<ViewStyle>;
  tone?: ShimmerTone;
  animatedValue?: Animated.Value;
}

export const ShimmerBox: React.FC<ShimmerBoxProps> = ({
  className = '',
  style,
  tone = 'light',
  animatedValue,
}) => {
  const contextAnimatedValue = useContext(SkeletonContext);
  const fallbackAnimatedValue = useShimmerAnimation(
    1600,
    !animatedValue && !contextAnimatedValue
  );
  const activeAnimatedValue =
    animatedValue ?? contextAnimatedValue ?? fallbackAnimatedValue;

  const [width, setWidth] = useState<number>(150);
  const rawId = useId();
  const gradientId = `ph-shimmer-${tone}-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const toneConfig = SHIMMER_TONE_CONFIG[tone];

  const onLayout = (e: LayoutChangeEvent) => {
    const measuredWidth = e.nativeEvent.layout.width;
    if (measuredWidth > 0 && measuredWidth !== width) {
      setWidth(measuredWidth);
    }
  };

  const translateX = activeAnimatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 1.5, width * 1.5],
  });

  return (
    <View
      onLayout={onLayout}
      className={`overflow-hidden ${className}`}
      style={[
        {
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: toneConfig.baseColor,
        },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
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
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <Stop
                offset="25%"
                stopColor="#FFFFFF"
                stopOpacity={toneConfig.edgeOpacity}
              />
              <Stop
                offset="50%"
                stopColor="#FFFFFF"
                stopOpacity={toneConfig.peakOpacity}
              />
              <Stop
                offset="75%"
                stopColor="#FFFFFF"
                stopOpacity={toneConfig.edgeOpacity}
              />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill={`url(#${gradientId})`}
          />
        </Svg>
      </Animated.View>
    </View>
  );
};
