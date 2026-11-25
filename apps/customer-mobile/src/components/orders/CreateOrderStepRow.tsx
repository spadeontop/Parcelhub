import React, { ReactNode } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const BRAND_BLUE = '#215cd4';

export interface CreateOrderStepRowProps {
  readonly stepNumber: number;
  readonly isDone?: boolean;
  readonly isActive?: boolean;
  readonly isError?: boolean;
  readonly topLineColor?: string | null;
  readonly bottomLineColor?: string | null;
  readonly contentPaddingBottom?: number;
  readonly children: ReactNode;
}

/**
 * Vertically-centered left-rail step indicator ((1) -> (2)) aligned beside a step card.
 */
export const CreateOrderStepRow: React.FC<CreateOrderStepRowProps> = ({
  stepNumber,
  isDone = false,
  isActive = false,
  isError = false,
  topLineColor = null,
  bottomLineColor = null,
  contentPaddingBottom = 0,
  children,
}) => {
  return (
    <View className="flex-row items-stretch">
      {/* Left Vertical Rail */}
      <View className="w-5 items-center mr-2.5">
        {topLineColor ? (
          <View
            className="flex-1 w-[2px]"
            style={{ backgroundColor: topLineColor }}
          />
        ) : (
          <View className="flex-1" />
        )}

        {isDone ? (
          <View
            className="w-5 h-5 rounded-full bg-[#215cd4] items-center justify-center"
            style={{
              shadowColor: BRAND_BLUE,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 6L9 17L4 12"
                stroke="#ffffff"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        ) : isActive ? (
          <View
            className="w-5 h-5 rounded-full items-center justify-center"
            style={{
              backgroundColor: isError ? '#dc2626' : BRAND_BLUE,
              shadowColor: isError ? '#dc2626' : BRAND_BLUE,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.22,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            <Text className="text-[10px] font-bold text-white">
              {stepNumber}
            </Text>
          </View>
        ) : (
          <View
            className="w-5 h-5 rounded-full items-center justify-center border-[1.5px]"
            style={{
              backgroundColor: isError ? '#fef2f2' : '#f1f5f9',
              borderColor: isError ? '#f87171' : '#cbd5e1',
            }}
          >
            <Text
              className="text-[10px] font-bold"
              style={{ color: isError ? '#dc2626' : '#94a3b8' }}
            >
              {stepNumber}
            </Text>
          </View>
        )}

        {bottomLineColor ? (
          <View
            className="flex-1 w-[2px]"
            style={{ backgroundColor: bottomLineColor }}
          />
        ) : (
          <View className="flex-1" />
        )}
      </View>

      {/* Right Step Card Slot */}
      <View className="flex-1" style={{ paddingBottom: contentPaddingBottom }}>
        {children}
      </View>
    </View>
  );
};

export default CreateOrderStepRow;
