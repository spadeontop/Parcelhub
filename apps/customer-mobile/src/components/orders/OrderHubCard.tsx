import React from 'react';
import { Text, View } from 'react-native';
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
 * and understated open/closed or refunded status pill.
 */
export const OrderHubCard: React.FC<OrderHubCardProps> = ({
  hubName = 'Lily’s Catering Hub',
  hubAddress = 'Yati, Liloan, Cebu, 6002',
  hubOpen = true,
  statusOverride,
  containerClassName = 'mb-3.5',
}) => {
  const pillLabel =
    statusOverride === 'refunded' ? 'Refunded' : hubOpen ? 'Open' : 'Closed';

  const pillBackground =
    statusOverride === 'refunded'
      ? '#f1f5f9'
      : hubOpen
      ? '#f0fdf4'
      : '#fef2f2';

  const pillTextColor =
    statusOverride === 'refunded'
      ? '#475569'
      : hubOpen
      ? '#15803d'
      : '#dc2626';

  return (
    <View
      className={`bg-white border border-[#edf2f7] rounded-[20px] px-5 py-4 flex-row items-center justify-between ${containerClassName}`}
      style={CARD_SHADOW}
    >
      <View className="flex-1 pr-3">
        <Text
          className="text-[14.5px] font-bold text-[#0f172a] tracking-[-0.2px]"
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

      <View
        className="px-3 py-1 rounded-full items-center justify-center"
        style={{ backgroundColor: pillBackground }}
      >
        <Text
          className="text-[12px] font-semibold"
          style={{ color: pillTextColor }}
        >
          {pillLabel}
        </Text>
      </View>
    </View>
  );
};

export default OrderHubCard;
