import React, { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { HOME_HERO_SHADOW } from './homeStyles';

interface ActiveParcelCardShellProps {
  children: React.ReactNode;
}

/**
 * Shared deep-to-bright primary blue gradient card container used by both
 * ActiveParcelCard and ActiveParcelCardSkeleton for identical hero geometry.
 */
export const ActiveParcelCardShell: React.FC<ActiveParcelCardShellProps> = ({
  children,
}) => {
  const rawId = useId();
  const gradientId = `activeCardGrad-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <View
      className="rounded-[24px] overflow-hidden mb-4"
      style={HOME_HERO_SHADOW}
    >
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#172554" stopOpacity="1" />
              <Stop offset="0.55" stopColor="#1d4ed8" stopOpacity="1" />
              <Stop offset="1" stopColor="#2563eb" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill={`url(#${gradientId})`}
          />
        </Svg>
      </View>

      <View className="p-5">{children}</View>
    </View>
  );
};
