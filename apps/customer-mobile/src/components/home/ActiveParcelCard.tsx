import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';
import { getStatusLabel } from '../../utils/statusHelpers';
import { CustomerOrderSummary, OrderStatus } from '../../types/api';

const PROGRESS_STAGES = ['Booked', 'In Transit', 'Ready'] as const;

function getOrderProgressStep(status: OrderStatus): number {
  switch (status) {
    case 'PENDING_INITIALIZATION':
    case 'PAYMENT_REQUIRED':
      return 1;
    case 'AWAITING_PARCEL':
      return 2;
    case 'READY_TO_CLAIM':
    case 'CLAIMED':
      return 3;
    default:
      return 0;
  }
}

export const ParcelGraphic: React.FC<{
  size?: number;
  showReadyBadge?: boolean;
}> = ({ size = 88, showReadyBadge = false }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Polygon points="32,8 53,20 32,32 11,20" fill="#ffffff" />
    <Polygon points="11,20 32,32 32,56 11,44" fill="#dbeafe" />
    <Polygon points="32,32 53,20 53,44 32,56" fill="#93c5fd" />
    <Polygon points="39,12 46,16 25,28 18,24" fill="#60a5fa" />
    <Polygon points="18,24 25,28 25,38 18,34" fill="#3b82f6" />
    <Polygon points="41,41 48,37 48,43 41,47" fill="#ffffff" />
    {showReadyBadge && (
      <>
        <Circle
          cx="48"
          cy="48"
          r="10"
          fill="#10b981"
          stroke="#1d4ed8"
          strokeWidth="2.5"
        />
        <Path
          d="M44 48.2l2.6 2.6 5.4-5.6"
          stroke="#ffffff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    )}
  </Svg>
);

export const TransitVanGraphic: React.FC<{ size?: number }> = ({
  size = 88,
}) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Path
      d="M5 24h7M3 31h6M6 38h5"
      stroke="#93c5fd"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <Rect x="13" y="18" width="27" height="24" rx="4" fill="#ffffff" />
    <Rect x="17" y="24" width="14" height="3.5" rx="1.75" fill="#93c5fd" />
    <Rect x="17" y="30" width="9" height="3" rx="1.5" fill="#dbeafe" />
    <Path
      d="M40 24h10.5c1.5 0 2.9.8 3.6 2.1l4.2 7.4c.5.9.7 1.8.7 2.8V42a2 2 0 01-2 2H40V24z"
      fill="#dbeafe"
    />
    <Path
      d="M43 27h6.2c.8 0 1.6.4 2 1.2l2.6 4.8H43V27z"
      fill="#2563eb"
    />
    <Rect x="13" y="40" width="46" height="4" rx="2" fill="#93c5fd" />
    <Circle
      cx="23"
      cy="45"
      r="5.5"
      fill="#1e3a8a"
      stroke="#ffffff"
      strokeWidth="2.2"
    />
    <Circle
      cx="49"
      cy="45"
      r="5.5"
      fill="#1e3a8a"
      stroke="#ffffff"
      strokeWidth="2.2"
    />
  </Svg>
);

interface ActiveParcelCardProps {
  order: CustomerOrderSummary | null;
  isLoading?: boolean;
  isBlacklisted?: boolean;
  onPressOrder: (order: CustomerOrderSummary) => void;
  onCreateOrder: () => void;
}

export const ActiveParcelCard: React.FC<ActiveParcelCardProps> = ({
  order,
  isLoading = false,
  isBlacklisted = false,
  onPressOrder,
  onCreateOrder,
}) => {
  if (isLoading && !order) {
    return (
      <View className="min-h-[168px] rounded-[24px] bg-[#2563eb] items-center justify-center p-6 mb-4">
        <ActivityIndicator size="small" color="#ffffff" />
      </View>
    );
  }

  const isReady = order?.status === 'READY_TO_CLAIM';

  const ctaLabel = !order
    ? '+ New Order'
    : order.isClaimActive
      ? 'Open Pickup Pass'
      : order.status === 'READY_TO_CLAIM'
        ? 'Claim Parcel'
        : order.status === 'PAYMENT_REQUIRED'
          ? 'Pay Order'
          : 'View Details';

  return (
    <View
      className="rounded-[24px] overflow-hidden mb-4"
      style={{
        backgroundColor: '#2563eb',
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
        elevation: 4,
      }}
    >
      {/* Inverted Deep-to-Bright Primary Blue Gradient */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <Defs>
            <LinearGradient id="activeCardGrad" x1="0" y1="0" x2="1" y2="1">
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
            fill="url(#activeCardGrad)"
          />
        </Svg>
      </View>

      <View className="p-5">
        {order ? (
          <>
            <View className="flex-row items-center mb-4">
              <View className="-ml-3 mr-2.5 shrink-0">
                {order.status === 'AWAITING_PARCEL' ? (
                  <TransitVanGraphic size={88} />
                ) : (
                  <ParcelGraphic size={88} showReadyBadge={isReady} />
                )}
              </View>

              <View className="flex-1">
                <Text className="text-[11px] font-bold text-[#dbeafe] uppercase tracking-[0.8px] mb-1">
                  {order.isClaimActive
                    ? 'Pass Active'
                    : getStatusLabel(order.status)}
                </Text>

                <Text
                  className="text-[20px] font-bold text-white tracking-tight leading-[26px]"
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {order.productName}
                </Text>
              </View>
            </View>

            {/* Labeled 3-Stage Progress */}
            <View className="mb-4">
              <View className="flex-row gap-1.5 mb-1.5">
                {PROGRESS_STAGES.map((stage, index) => {
                  const step = index + 1;
                  const activeStep = getOrderProgressStep(order.status);
                  const isFilled = step <= activeStep;
                  return (
                    <View
                      key={stage}
                      className="flex-1 h-1.5 rounded-full"
                      style={{
                        backgroundColor: isFilled
                          ? '#ffffff'
                          : 'rgba(255, 255, 255, 0.24)',
                      }}
                    />
                  );
                })}
              </View>
              <View className="flex-row justify-between">
                {PROGRESS_STAGES.map((stage, index) => {
                  const step = index + 1;
                  const activeStep = getOrderProgressStep(order.status);
                  const isCurrent = step === activeStep;
                  return (
                    <Text
                      key={stage}
                      className="text-[11px]"
                      style={{
                        color: isCurrent
                          ? '#ffffff'
                          : 'rgba(219, 234, 254, 0.72)',
                        fontWeight: isCurrent ? '600' : '400',
                      }}
                    >
                      {stage}
                    </Text>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => onPressOrder(order)}
              className="w-full h-11 rounded-xl bg-white items-center justify-center"
            >
              <Text className="text-[13px] font-bold text-[#2563eb]">
                {ctaLabel}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View className="flex-row items-center mb-4">
              <View className="-ml-3 mr-2 shrink-0">
                <ParcelGraphic size={88} />
              </View>

              <View className="flex-1">
                <Text className="text-[11px] font-bold text-[#dbeafe] uppercase tracking-[0.8px] mb-1">
                  PARCELHUB PICKUP
                </Text>
                <Text className="text-[20px] font-bold text-white tracking-tight">
                  Expecting a delivery?
                </Text>
                <Text className="text-[13px] text-[#dbeafe] mt-1 leading-[19px]">
                  Register your parcel to track when it arrives.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onCreateOrder}
              className="w-full h-11 rounded-xl bg-white items-center justify-center"
              style={{ opacity: isBlacklisted ? 0.5 : 1 }}
            >
              <Text className="text-[13px] font-bold text-[#2563eb]">
                {ctaLabel}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

export default ActiveParcelCard;
