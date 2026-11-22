import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useV1 } from '../../v1/context/V1Context';
import { BottomNav } from '../layout/BottomNav';
import { AppHeader } from '../layout/AppHeader';
import { getStatusTheme } from '../../utils/statusHelpers';
import { formatOrderDate } from '../../v1/utils/date';

export type TransactionFilter =
  | 'ALL'
  | 'READY_TO_CLAIM'
  | 'AWAITING_PARCEL'
  | 'PAYMENT_REQUIRED'
  | 'CLAIMED';

const FILTERS: TransactionFilter[] = [
  'ALL',
  'READY_TO_CLAIM',
  'AWAITING_PARCEL',
  'PAYMENT_REQUIRED',
  'CLAIMED',
];

const getFilterLabel = (filter: TransactionFilter): string => {
  switch (filter) {
    case 'ALL':
      return 'All Orders';
    case 'READY_TO_CLAIM':
      return 'Ready to Claim';
    case 'AWAITING_PARCEL':
      return 'Awaiting Parcel';
    case 'PAYMENT_REQUIRED':
      return 'Payment Required';
    case 'CLAIMED':
      return 'Claimed';
    default:
      return filter;
  }
};

export const TransactionsScreen: React.FC = () => {
  const {
    orders,
    navigateTo,
    refetchOrders,
    transactionFilter,
    setTransactionFilter,
  } = useV1();
  const [refreshing, setRefreshing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const dropdownOffset = useSharedValue(-108);
  const dropdownStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: `${dropdownOffset.value}%` as const }],
  }));

  useEffect(() => {
    dropdownOffset.value = withTiming(filterOpen ? 0 : -108, {
      duration: filterOpen ? 220 : 180,
      easing: filterOpen ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
  }, [dropdownOffset, filterOpen]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchOrders();
    } catch {
      // Ignored for pull to refresh
    } finally {
      setRefreshing(false);
    }
  };

  const filteredOrders =
    transactionFilter === 'ALL'
      ? orders
      : orders.filter((o) => o.status === transactionFilter);

  return (
    <View className="flex-1 bg-[#2560ea]">
      <StatusBar style="light" />

      {/* Top Header */}
      <AppHeader
        title="Transactions"
        subtitle="ORDER HISTORY"
        backgroundColor="#2560ea"
      />

      {/* Main Sheet with Curved Transition */}
      <View className="flex-1 bg-white rounded-t-[32px] pt-5 relative">
        <TouchableOpacity
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel="Filter orders"
          accessibilityState={{ expanded: filterOpen }}
          onPress={() => setFilterOpen((open) => !open)}
          className="mx-5 mb-3 h-[50px] border border-[#e5eaf3] rounded-2xl flex-row items-center justify-between px-4 bg-white"
        >
          <Text className="text-[14px] font-semibold text-[#111827]">{getFilterLabel(transactionFilter)}</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-[12px] font-medium text-[#2563eb]">{filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}</Text>
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <Path d="M5 7.5L10 12.5L15 7.5" stroke="#64748b" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
        </TouchableOpacity>

        <View
          pointerEvents="box-none"
          className="absolute top-[76px] left-3 right-3 z-10 overflow-hidden px-2 pb-4"
          style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          collapsable={false}
        >
          <Animated.View
            pointerEvents={filterOpen ? 'auto' : 'none'}
            accessibilityElementsHidden={!filterOpen}
            importantForAccessibility={filterOpen ? 'auto' : 'no-hide-descendants'}
            style={[{
              backgroundColor: '#fff',
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }, dropdownStyle]}
          >
            <View className="bg-white border border-[#e5eaf3] rounded-2xl py-2 overflow-hidden"
              style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5eaf3', borderRadius: 16, overflow: 'hidden' }}>
            {FILTERS.map((f) => {
              const selected = transactionFilter === f;
              const count = f === 'ALL' ? orders.length : orders.filter((order) => order.status === f).length;
              const dotColor = f === 'ALL' ? '#4b5563' : getStatusTheme(f).dotColor;
              return (
                <TouchableOpacity
                  key={f}
                  disabled={!filterOpen}
                  activeOpacity={1}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setTransactionFilter(f);
                    setFilterOpen(false);
                  }}
                  className={`flex-row items-center justify-between px-4 py-3 ${selected ? 'bg-[#eff6ff]' : 'bg-white'}`}
                >
                  <View className="flex-row items-center gap-2.5">
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
                    <Text className={`text-[13px] text-[#111827] ${selected ? 'font-semibold' : 'font-medium'}`}>{getFilterLabel(f)}</Text>
                  </View>
                  <Text className="text-[12px] text-[#4b5563]">{count}</Text>
                </TouchableOpacity>
              );
            })}
            </View>
          </Animated.View>
        </View>

        {/* Scrollable Content Container */}
        <View className="mx-5 mb-24 bg-white border border-[#e4e4e7] rounded-[24px] overflow-hidden" style={{ flexShrink: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563eb']}
            />
          }
        >
          {/* Transactions Container - Full Width */}
          <View>
            {/* Header */}

            {/* List Rows */}
            {filteredOrders.length === 0 ? (
              <View className="py-14 items-center justify-center px-4">
                <Text className="text-sm font-medium text-[#94a3b8] text-center">
                  No orders found matching this filter.
                </Text>
              </View>
            ) : (
              filteredOrders.map((order, idx) => {
                const statusTheme = getStatusTheme(order.status);
                const isLast = idx === filteredOrders.length - 1;

                return (
                  <TouchableOpacity
                    key={order.id}
                    activeOpacity={0.7}
                    onPress={() =>
                      navigateTo('order_details', {
                        orderId: order.id,
                        ticketCode: order.ticketCode,
                      })
                    }
                    className={`flex-row items-center justify-between ${
                      !isLast ? 'border-b border-[#e8ebf2]' : ''
                    }`}
                    style={{
                      minHeight: 60,
                      paddingVertical: 8,
                      paddingRight: 12,
                    }}
                  >
                    {/* Left: Product Name & Date */}
                    <View className="flex-1 pr-3">
                      <Text
                        className="text-[13px] font-semibold text-[#172033] leading-[18px]"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {order.productName || 'Unknown Package'}
                      </Text>
                      <Text className="text-[10px] font-normal text-[#667184] leading-[15px] mt-1">
                        {formatOrderDate(order.timestamp) || 'Recent Order'}
                      </Text>
                    </View>

                    {/* Right: Status Dot + Label + Chevron */}
                    <View className="flex-row items-center gap-2 shrink-0">
                      <Text
                        className="text-[11.5px] text-[#18181b] leading-[16px]"
                      >
                        {statusTheme.label}
                      </Text>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusTheme.dotColor }} />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
        </View>

        {/* Floating Bottom Nav inside the Main Sheet */}
        <BottomNav activeTab="transactions" />
      </View>
    </View>
  );
};

export default TransactionsScreen;
