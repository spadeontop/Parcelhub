import React from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { OrderStatus, OrderStatusHistoryTuple } from '../../types/api';
import { CheckIcon, CloseIcon } from '../common/Icons';
import { OrderSectionCard } from './OrderDetailPrimitives';

export type TimelineNodeVariant = 'done' | 'active' | 'cancelled' | 'pending';

export interface OrderTimelineStepItem {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  readonly timestamp?: string | null;
  readonly variant: TimelineNodeVariant;
  readonly titleTone?: 'default' | 'brand' | 'danger' | 'success' | 'muted';
  readonly timestampTone?: 'default' | 'brand' | 'danger' | 'success';
  readonly action?: React.ReactNode;
}

interface OrderStatusTimelineProps {
  readonly title?: string;
  readonly headerRight?: React.ReactNode;
  readonly steps: readonly OrderTimelineStepItem[];
  readonly style?: StyleProp<ViewStyle>;
}

/**
 * Formats an ISO timestamp string as a short local clock time (e.g. "03:57 AM").
 */
export function formatShortTime(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Finds the formatted local time of a status entry in an order's timeline history.
 */
export function getTimelineEntryTime(
  statusTimeline: OrderStatusHistoryTuple,
  statusKey: OrderStatus
): string | null {
  if (!Array.isArray(statusTimeline)) return null;
  const entry = statusTimeline.find((e) => e.status === statusKey);
  return formatShortTime(entry?.timestamp);
}

const renderStepNode = (variant: TimelineNodeVariant) => {
  switch (variant) {
    case 'done':
      return (
        <View
          className="w-6 h-6 rounded-full bg-[#10b981] items-center justify-center"
          style={{
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <CheckIcon size={13} color="#ffffff" strokeWidth={3} />
        </View>
      );
    case 'active':
      return (
        <View
          className="w-6 h-6 rounded-full bg-[#215cd4] items-center justify-center"
          style={{
            shadowColor: '#215cd4',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View className="w-2.5 h-2.5 rounded-full bg-white" />
        </View>
      );
    case 'cancelled':
      return (
        <View className="w-6 h-6 rounded-full bg-[#ef4444] items-center justify-center">
          <CloseIcon size={13} color="#ffffff" />
        </View>
      );
    case 'pending':
    default:
      return (
        <View className="w-6 h-6 rounded-full bg-[#f8fafc] border-2 border-[#cbd5e1] items-center justify-center" />
      );
  }
};

const resolveTitleColor = (
  tone: OrderTimelineStepItem['titleTone'],
  variant: TimelineNodeVariant
): string => {
  switch (tone) {
    case 'brand':
      return '#215cd4';
    case 'danger':
      return '#dc2626';
    case 'success':
      return '#059669';
    case 'muted':
      return '#64748b';
    default:
      if (variant === 'active') return '#215cd4';
      if (variant === 'pending') return '#475569';
      return '#0f172a';
  }
};

const resolveTimestampColor = (
  tone: OrderTimelineStepItem['timestampTone'],
  variant: TimelineNodeVariant
): string => {
  switch (tone) {
    case 'brand':
      return '#215cd4';
    case 'danger':
      return '#dc2626';
    case 'success':
      return '#059669';
    default:
      return variant === 'active' ? '#215cd4' : '#94a3b8';
  }
};

/**
 * Reusable vertical status timeline card with clean per-step connectors
 * that never bleed behind trailing hollow step nodes.
 */
export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  title = 'STATUS TIMELINE',
  headerRight,
  steps,
  style,
}) => (
  <OrderSectionCard title={title} headerRight={headerRight} style={style}>
    <View className="mt-4">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isPending = step.variant === 'pending';

        return (
          <View key={step.key} className="flex-row">
            <View className="items-center mr-3.5" style={{ width: 24 }}>
              <View className="mt-0.5">{renderStepNode(step.variant)}</View>
              {!isLast && <View className="flex-1 w-[2px] bg-[#e2e8f0] my-1.5" />}
            </View>

            <View className={isLast ? 'flex-1' : 'flex-1 pb-5'}>
              <View className="flex-row items-baseline justify-between gap-2">
                <Text
                  className="text-[14px]"
                  style={{
                    color: resolveTitleColor(step.titleTone, step.variant),
                    fontWeight: isPending ? '600' : '700',
                  }}
                >
                  {step.title}
                </Text>
                {step.timestamp ? (
                  <Text
                    className="text-[11.5px] font-semibold"
                    style={{
                      color: resolveTimestampColor(step.timestampTone, step.variant),
                    }}
                  >
                    {step.timestamp}
                  </Text>
                ) : null}
              </View>

              <Text
                className="text-[12.5px] font-normal mt-0.5 leading-[18px]"
                style={{ color: isPending ? '#94a3b8' : '#64748b' }}
              >
                {step.description}
              </Text>

              {step.action}
            </View>
          </View>
        );
      })}
    </View>
  </OrderSectionCard>
);
