import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { FilterDropdown } from '../common/FilterDropdown';
import { StatusBar } from 'expo-status-bar';
import { useNavigationUi } from '../../context/NavigationAndUiContext';
import { useInfiniteCustomerOrders } from '../../hooks/useCustomerOrders';
import { BottomNav } from '../layout/BottomNav';
import { AppHeader } from '../layout/AppHeader';
import { getStatusTheme } from '../../utils/statusHelpers';
import { formatOrderDate } from '../../utils/date';

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
    navigateTo,
    transactionFilter,
    setTransactionFilter,
  } = useNavigationUi();
  const {
    orders,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteCustomerOrders();
  const [refreshing, setRefreshing] = useState(false);

  const filteredOrders =
    transactionFilter === 'ALL'
      ? orders
      : orders.filter((o) => o.status === transactionFilter);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch {
      // Ignored for pull to refresh
    } finally {
      setRefreshing(false);
    }
  };

  const countSuffix = hasNextPage ? '+' : '';
  const countLabel = `${filteredOrders.length}${countSuffix} ${filteredOrders.length === 1 && !hasNextPage ? 'Order' : 'Orders'}`;

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
          countLabel={countLabel}
          options={FILTERS.map((filter) => ({
            value: filter,
            label: getFilterLabel(filter),
            color: filter === 'ALL' ? '#4b5563' : getStatusTheme(filter).dotColor,
          }))}
        />

        {/* Scrollable Content Container */}
        <View className="mx-5 mb-24 bg-white border border-[#e5eaf3] rounded-[24px] overflow-hidden" style={{ flexShrink: 1 }}>
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                void fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.3}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2563eb']}
              />
            }
            ListEmptyComponent={
              isLoading ? (
                <View className="py-14 items-center justify-center">
                  <ActivityIndicator size="small" color="#2563eb" />
                </View>
              ) : (
                <View className="py-14 items-center justify-center px-4">
                  <Text className="text-sm font-medium text-[#94a3b8] text-center">
                    No orders found matching this filter.
                  </Text>
                </View>
              )
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View className="py-4 items-center justify-center">
                  <ActivityIndicator size="small" color="#2563eb" />
                </View>
              ) : undefined
            }
            renderItem={({ item: order, index }) => {
              const statusTheme = getStatusTheme(order.status);
              const isLast = index === filteredOrders.length - 1;

              return (
                <TouchableOpacity
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

                  {/* Right: Status Dot + Label */}
                  <View className="flex-row items-center gap-2 shrink-0">
                    <Text className="text-[11.5px] font-medium text-[#18181b] leading-[16px]">
                      {statusTheme.label}
                    </Text>
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: statusTheme.dotColor,
                      }}
                    />
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Floating Bottom Nav inside the Main Sheet */}
        <BottomNav activeTab="transactions" />
      </View>
    </View>
  );
};

export default TransactionsScreen;
