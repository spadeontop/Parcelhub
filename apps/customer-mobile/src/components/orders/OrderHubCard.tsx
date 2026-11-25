import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CARD_SHADOW } from '../common/cardStyles';

interface OrderHubCardProps {
  readonly hubName?: string;
  readonly hubAddress?: string;
  readonly hubOpen?: boolean;
  readonly statusOverride?: 'refunded';
  readonly containerClassName?: string;
}

/**
 * Shared hub location card displaying the pickup hub name, address,
 * and current open/closed or refunded status badge across all order detail views.
 */
export const OrderHubCard: React.FC<OrderHubCardProps> = ({
  hubName = 'Lily’s Catering Hub',
  hubAddress = 'Yati, Liloan, Cebu, 6002',
  hubOpen = true,
  statusOverride,
  containerClassName = 'mb-3.5',
}) => {
  return (
    <View
      className={`bg-white border border-[#edf2f7] rounded-[20px] px-4 py-4 flex-row items-center justify-between ${containerClassName}`}
      style={CARD_SHADOW}
    >
      <View className="flex-row items-center flex-1 pr-3">
        <View className="w-10 h-10 rounded-[12px] bg-[#eff6ff] border border-[#dbeafe] items-center justify-center mr-3">
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
              stroke="#215cd4"
              strokeWidth={1.9}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
              stroke="#215cd4"
              strokeWidth={1.9}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>

        <View className="flex-1">
          <Text
            className="text-[14px] font-bold text-[#0f172a] tracking-[-0.2px]"
            numberOfLines={1}
          >
            {hubName}
          </Text>
          <Text
            className="text-[12px] text-[#64748b] font-normal mt-0.5"
            numberOfLines={1}
          >
            {hubAddress}
          </Text>
        </View>
      </View>

      {statusOverride === 'refunded' ? (
        <View
          className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            backgroundColor: '#ecfdf5',
            borderWidth: 1,
            borderColor: '#d1fae5',
          }}
        >
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path
              d="M20 6L9 17L4 12"
              stroke="#059669"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text className="text-[12px] font-semibold text-[#059669]">Refunded</Text>
        </View>
      ) : (
        <View
          className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={
            hubOpen
              ? {
                  backgroundColor: '#ecfdf5',
                  borderWidth: 1,
                  borderColor: '#d1fae5',
                }
              : {
                  backgroundColor: '#fef2f2',
                  borderWidth: 1,
                  borderColor: '#fecaca',
                }
          }
        >
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: hubOpen ? '#10b981' : '#ef4444',
            }}
          />
          <Text
            className="text-[12px] font-semibold"
            style={{ color: hubOpen ? '#059669' : '#dc2626' }}
          >
            {hubOpen ? 'Open' : 'Closed'}
          </Text>
        </View>
      )}
    </View>
  );
};

export default OrderHubCard;
