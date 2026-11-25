import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useNavigationUi } from '../../context/NavigationAndUiContext';
import { useToast } from '../../context/ToastContext';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useCustomerOrders } from '../../hooks/useCustomerOrders';
import { BottomNav } from '../layout/BottomNav';
import { AppHeader } from '../layout/AppHeader';
import { ActiveParcelCard } from '../home/ActiveParcelCard';
import { formatOrderDate } from '../../utils/date';
import {
  getStatusLabel,
  getStatusPillStyles,
} from '../../utils/statusHelpers';
import { CustomerOrderSummary, TransactionFilter } from '../../types/api';

const CARD_SHADOW = {
  shadowColor: '#0f172a',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 2,
} as const;

const FAB_SHADOW = {
  shadowColor: '#2563eb',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.34,
  shadowRadius: 14,
  elevation: 8,
} as const;

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Register your parcel',
    desc: 'Upload your receipt or order details before delivery.',
  },
  {
    step: '02',
    title: 'We receive it at the hub',
    desc: 'Get notified as soon as your package arrives safely.',
  },
  {
    step: '03',
    title: 'Claim with your QR pass',
    desc: 'Present your pickup pass at the counter for quick release.',
  },
] as const;

const MovingTruckIcon: React.FC<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}> = ({ size = 20, color = '#2563eb', strokeWidth = 1.9 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1.5 9.5h2.5M1 13h2"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Path
      d="M6.5 6.5h8v9.5h-9V7.5a1 1 0 0 1 1-1Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <Path
      d="M14.5 9.5h3.7c.55 0 1.06.3 1.33.78l1.67 2.92c.2.35.3.74.3 1.14V16h-7V9.5Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <Circle
      cx="8.8"
      cy="16.5"
      r="1.9"
      fill="#ffffff"
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <Circle
      cx="18"
      cy="16.5"
      r="1.9"
      fill="#ffffff"
      stroke={color}
      strokeWidth={strokeWidth}
    />
  </Svg>
);

export const HomeScreen: React.FC = () => {
  const { navigateTo } = useNavigationUi();
  const { showToast } = useToast();
  const { customer, refetchProfile } = useAuthSession();
  const { orders, isLoading, refetchOrders } = useCustomerOrders();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchOrders(), refetchProfile()]);
    setRefreshing(false);
  };

  const displayName = customer?.firstName?.trim() || 'Customer';
  const isBlacklisted = Boolean(customer?.blacklisted);

  const {
    spotlightOrder,
    recentFeedOrders,
    readyCount,
    unpaidCount,
    awaitingCount,
  } = useMemo(() => {
    const ready: CustomerOrderSummary[] = [];
    const unpaid: CustomerOrderSummary[] = [];
    const awaiting: CustomerOrderSummary[] = [];
    let activeClaim: CustomerOrderSummary | null = null;

    for (const order of orders) {
      if (order.status === 'READY_TO_CLAIM') {
        ready.push(order);
        if (order.isClaimActive && !activeClaim) {
          activeClaim = order;
        }
      } else if (order.status === 'PAYMENT_REQUIRED') {
        unpaid.push(order);
      } else if (order.status === 'AWAITING_PARCEL') {
        awaiting.push(order);
      }
    }

    const active = [...ready, ...unpaid, ...awaiting];
    const spotlight =
      activeClaim || ready[0] || unpaid[0] || awaiting[0] || null;

    // Prioritize other active orders first, then fill with recent history so the list feels complete.
    const otherActive = spotlight
      ? active.filter((o) => o.id !== spotlight.id)
      : active;
    const otherActiveIds = new Set(otherActive.map((o) => o.id));
    const history = orders.filter(
      (o) => o.id !== spotlight?.id && !otherActiveIds.has(o.id)
    );
    const combined = [...otherActive, ...history];
    const feed =
      combined.length > 0
        ? combined.slice(0, 4)
        : spotlight
          ? [spotlight]
          : [];

    return {
      spotlightOrder: spotlight,
      recentFeedOrders: feed,
      readyCount: ready.length,
      unpaidCount: unpaid.length,
      awaitingCount: awaiting.length,
    };
  }, [orders]);

  const openOrder = useCallback(
    (order: CustomerOrderSummary) => {
      navigateTo('order_details', {
        orderId: order.id,
        ticketCode: order.ticketCode,
      });
    },
    [navigateTo]
  );

  const openFilteredOrders = useCallback(
    (filter: TransactionFilter) => {
      navigateTo('transactions', { filter });
    },
    [navigateTo]
  );

  const handleCreateOrder = () => {
    if (isBlacklisted) {
      showToast(
        customer?.blacklistReason ||
          'Your account is suspended from creating new orders.'
      );
      return;
    }
    navigateTo('create_order');
  };

  const summaryBuckets: ReadonlyArray<{
    filter: TransactionFilter;
    label: string;
    count: number;
    renderIcon: () => React.ReactNode;
  }> = [
    {
      filter: 'READY_TO_CLAIM',
      label: 'Claimable',
      count: readyCount,
      renderIcon: () => (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 12.75L11.25 15L15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="#059669"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
    },
    {
      filter: 'AWAITING_PARCEL',
      label: 'Awaiting',
      count: awaitingCount,
      renderIcon: () => (
        <MovingTruckIcon size={21} color="#2563eb" strokeWidth={1.9} />
      ),
    },
    {
      filter: 'PAYMENT_REQUIRED',
      label: 'Unpaid',
      count: unpaidCount,
      renderIcon: () => (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
          <Rect
            x="2.5"
            y="5.5"
            width="19"
            height="13"
            rx="2.5"
            stroke="#d97706"
            strokeWidth={1.95}
          />
          <Path
            d="M2.5 10h19M6.5 14.5h4"
            stroke="#d97706"
            strokeWidth={1.95}
            strokeLinecap="round"
          />
        </Svg>
      ),
    },
  ];

  return (
    <View className="flex-1 bg-[#2563eb]">
      {/* Standard Top Header */}
      <AppHeader
        title="ParcelHub"
        subtitle="LILY'S CATERING HUB"
        showLogo
        statusDotColor="#10b981"
      />

      {/* Main Sheet */}
      <View className="flex-1 bg-[#f8fafc] rounded-t-[32px] overflow-hidden relative">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-5"
          contentContainerStyle={{ paddingTop: 22, paddingBottom: 156 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563eb']}
            />
          }
        >
          {/* Greeting */}
          <View className="mb-4">
            <Text
              className="text-[24px] font-bold text-[#0f172a] tracking-tight"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Hi, {displayName}
            </Text>
          </View>

          {/* Suspension Notice (only if blacklisted) */}
          {isBlacklisted && (
            <View className="rounded-2xl bg-[#fef2f2] border border-[#fecaca] px-4 py-3 mb-4">
              <Text className="text-[12px] font-medium text-[#b91c1c] leading-[18px]">
                {customer?.blacklistReason ||
                  'Your account is currently suspended from creating new orders.'}
              </Text>
            </View>
          )}

          {/* Focal Active Parcel Card */}
          <ActiveParcelCard
            order={spotlightOrder}
            isLoading={isLoading && orders.length === 0}
            isBlacklisted={isBlacklisted}
            onPressOrder={openOrder}
            onCreateOrder={handleCreateOrder}
          />

          {/* Parcel Status Overview Strip */}
          <View className="flex-row gap-2.5 mb-5">
            {summaryBuckets.map((bucket) => (
              <TouchableOpacity
                key={bucket.filter}
                activeOpacity={0.8}
                onPress={() => openFilteredOrders(bucket.filter)}
                className="flex-1 rounded-[18px] bg-white border border-[#edf2f7] px-3.5 py-3"
                style={CARD_SHADOW}
              >
                <View className="flex-row items-center justify-between mb-2">
                  {bucket.renderIcon()}
                  <Text
                    className="text-[20px] font-bold tracking-tight"
                    style={{
                      color: bucket.count > 0 ? '#0f172a' : '#cbd5e1',
                    }}
                  >
                    {bucket.count}
                  </Text>
                </View>
                <Text
                  className="text-[12px] font-semibold text-[#475569]"
                  numberOfLines={1}
                >
                  {bucket.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent Activity or Onboarding Guide */}
          {recentFeedOrders.length > 0 ? (
            <View>
              <View className="flex-row items-center justify-between mb-2.5 px-1">
                <Text className="text-[12px] font-bold text-[#64748b] uppercase tracking-[0.6px]">
                  Recent Activity
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => openFilteredOrders('ALL')}
                  className="flex-row items-center gap-1"
                >
                  <Text className="text-[12px] font-semibold text-[#2563eb]">
                    See all ({orders.length})
                  </Text>
                  <Svg width={5} height={9} viewBox="0 0 6 10" fill="none">
                    <Path
                      d="M0.75 0.75L4.85 4.85L0.75 8.95"
                      stroke="#2563eb"
                      strokeWidth={1.7}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>

              <View
                className="bg-white rounded-[20px] border border-[#edf2f7] px-4 py-1"
                style={CARD_SHADOW}
              >
                {recentFeedOrders.map((order, idx) => {
                  const pillStyles = getStatusPillStyles(order.status);

                  return (
                    <TouchableOpacity
                      key={order.id}
                      activeOpacity={0.75}
                      onPress={() => openOrder(order)}
                      className="py-3 flex-row items-center justify-between"
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
                          {order.productName}
                        </Text>
                        <Text
                          className="text-[11.5px] font-medium text-[#64748b] mt-0.5"
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {formatOrderDate(order.timestamp)}
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-2 shrink-0">
                        <View
                          className="px-2.5 py-1 rounded-full items-center justify-center"
                          style={pillStyles.containerStyle}
                        >
                          <Text
                            className="text-[11px] font-semibold leading-[14px]"
                            style={{ color: pillStyles.textColor }}
                          >
                            {getStatusLabel(order.status)}
                          </Text>
                        </View>
                        <Svg width={5} height={9} viewBox="0 0 6 10" fill="none">
                          <Path
                            d="M0.75 0.75L4.85 4.85L0.75 8.95"
                            stroke="#cbd5e1"
                            strokeWidth={1.6}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            <View>
              <Text className="text-[12px] font-bold text-[#64748b] uppercase tracking-[0.6px] mb-2.5 px-1">
                How Pickup Works
              </Text>
              <View
                className="bg-white rounded-[20px] border border-[#edf2f7] p-4"
                style={CARD_SHADOW}
              >
                {HOW_IT_WORKS_STEPS.map((item, idx) => (
                  <View
                    key={item.step}
                    className="flex-row items-start"
                    style={idx !== 0 ? { marginTop: 14 } : undefined}
                  >
                    <Text className="text-[12px] font-bold text-[#2563eb] w-6 mt-0.5">
                      {item.step}
                    </Text>
                    <View className="flex-1 ml-1.5">
                      <Text className="text-[13.5px] font-semibold text-[#0f172a]">
                        {item.title}
                      </Text>
                      <Text className="text-[12px] text-[#64748b] mt-0.5 leading-[17px]">
                        {item.desc}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Lower-Right Thumb FAB for New Order */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleCreateOrder}
          accessibilityLabel="New Order"
          className="absolute w-14 h-14 rounded-full bg-[#2563eb] items-center justify-center"
          style={[
            FAB_SHADOW,
            {
              right: 20,
              bottom: 88,
              zIndex: 60,
              opacity: isBlacklisted ? 0.5 : 1,
            },
          ]}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 5v14M5 12h14"
              stroke="#ffffff"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </Svg>
        </TouchableOpacity>

        {/* Floating Bottom Nav */}
        <BottomNav activeTab="home" />
      </View>
    </View>
  );
};

export default HomeScreen;
