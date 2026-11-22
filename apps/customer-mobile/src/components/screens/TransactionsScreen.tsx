import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { FilterDropdown } from '../common/FilterDropdown';
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
  | 'CLAIMED'
  | 'CANCELLED'
  | 'REFUNDED';

const FILTERS: TransactionFilter[] = [
  'ALL',
  'READY_TO_CLAIM',
  'AWAITING_PARCEL',
  'PAYMENT_REQUIRED',
  'CLAIMED',
  'CANCELLED',
  'REFUNDED',
];

const getFilterLabel = (filter: TransactionFilter): string => {
  switch (filter) {
    case 'ALL':
      return 'All Orders';
    case 'READY_TO_CLAIM':
      return 'Claimable';
    case 'AWAITING_PARCEL':
      return 'Awaiting';
    case 'PAYMENT_REQUIRED':
      return 'Unpaid';
    case 'CLAIMED':
      return 'Claimed';
    case 'CANCELLED':
      return 'Cancelled';
    case 'REFUNDED':
      return 'Refunded';
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
        <FilterDropdown
          value={transactionFilter}
          onChange={setTransactionFilter}
          accessibilityLabel="Filter orders"
          countLabel={`${filteredOrders.length} ${filteredOrders.length === 1 ? 'Order' : 'Orders'}`}
          options={FILTERS.map((filter) => ({
            value: filter,
            label: getFilterLabel(filter),
            count: filter === 'ALL' ? orders.length : orders.filter((order) => order.status === filter).length,
            color: filter === 'ALL' ? '#4b5563' : getStatusTheme(filter).dotColor,
          }))}
        />

        {/* Scrollable Content Container */}
        <View className="mx-5 mb-24 bg-white border border-[#e5eaf3] rounded-[24px] overflow-hidden" style={{ flexShrink: 1 }}>
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
