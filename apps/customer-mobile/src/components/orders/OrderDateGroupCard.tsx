import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { CARD_SHADOW } from '../common/cardStyles';
import { ChevronRightIcon } from '../common/Icons';
import { formatOrderCompactTimestamp } from '../../utils/date';
import { getStatusLabel, getStatusPillStyles } from '../../utils/statusHelpers';
import { CustomerOrderSummary } from '../../types/api';

export interface OrderDateGroup {
  readonly key: string;
  readonly title: string;
  readonly isRecentDay: boolean;
  readonly items: readonly CustomerOrderSummary[];
}

interface OrderDateGroupCardProps {
  readonly group: OrderDateGroup;
  readonly onPressOrder: (order: CustomerOrderSummary) => void;
}

/**
 * Renders a chronological group header ("Today", "Yesterday", or "Month Year")
 * paired with a unified minimalist order list card matching HomeScreen.
 */
export const OrderDateGroupCard: React.FC<OrderDateGroupCardProps> = ({
  group,
  onPressOrder,
}) => (
  <View className="mb-5">
    <Text className="text-[11.5px] font-bold text-[#64748b] uppercase tracking-[0.6px] mb-2 px-1">
      {group.title}
    </Text>

    <View
      className="bg-white rounded-[20px] border border-[#edf2f7] px-4 py-1"
      style={CARD_SHADOW}
    >
      {group.items.map((order, idx) => {
        const pillStyles = getStatusPillStyles(order.status);
        const isPassActive =
          order.status === 'READY_TO_CLAIM' && Boolean(order.isClaimActive);
        const statusText = isPassActive
          ? 'Pass Active'
          : getStatusLabel(order.status);
        const timeLabel = formatOrderCompactTimestamp(
          order.timestamp,
          group.isRecentDay
        );
        const hasPrice = typeof order.price === 'number' && order.price > 0;

        return (
          <TouchableOpacity
            key={order.id}
            activeOpacity={0.72}
            onPress={() => onPressOrder(order)}
            className="py-3.5 flex-row items-center justify-between"
            style={
              idx !== 0
                ? { borderTopWidth: 1, borderTopColor: '#f1f5f9' }
                : undefined
            }
          >
            <View className="flex-1 pr-3">
              <Text
                className="text-[14px] font-semibold text-[#0f172a] leading-[19px]"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {order.productName || 'Unknown Package'}
              </Text>
              <View className="flex-row items-center gap-2.5 mt-1.5">
                <View
                  className="px-2 py-0.5 rounded-full items-center justify-center"
                  style={pillStyles.containerStyle}
                >
                  <Text
                    className="text-[11px] font-semibold leading-[14px]"
                    style={{ color: pillStyles.textColor }}
                    numberOfLines={1}
                  >
                    {statusText}
                  </Text>
                </View>
                <Text
                  className="text-[11.5px] font-medium text-[#64748b] shrink"
                  numberOfLines={1}
                >
                  {timeLabel}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-1.5 shrink-0">
              {hasPrice && (
                <Text className="text-[14px] font-semibold text-[#0f172a]">
                  ₱{order.price!.toLocaleString('en-US')}
                </Text>
              )}
              <ChevronRightIcon size={14} color="#cbd5e1" />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export default OrderDateGroupCard;
