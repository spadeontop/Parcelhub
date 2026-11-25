import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { FilterDropdown } from '../common/FilterDropdown';
import { SkeletonGroup, ShimmerBox } from '../common/Skeleton';
import { HOME_CARD_SHADOW } from '../home/homeStyles';
import { useNavigationUi } from '../../context/NavigationAndUiContext';
import { useInfiniteCustomerOrders } from '../../hooks/useCustomerOrders';
import { BottomNav } from '../layout/BottomNav';
import { AppHeader } from '../layout/AppHeader';
import {
  getStatusLabel,
  getStatusPillStyles,
  getStatusTheme,
} from '../../utils/statusHelpers';
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

const SKELETON_ROWS = [
  { titleWidth: '72%', pillWidth: 74 },
  { titleWidth: '58%', pillWidth: 82 },
  { titleWidth: '80%', pillWidth: 68 },
  { titleWidth: '64%', pillWidth: 76 },
  { titleWidth: '70%', pillWidth: 70 },
] as const;

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

const TransactionsListSkeleton: React.FC = () => (
  <SkeletonGroup enabled>
    <View
      className="px-5 pt-1"
      accessibilityLabel="Loading orders"
      accessibilityState={{ busy: true }}
    >
      {SKELETON_ROWS.map((row, idx) => (
        <View
          key={idx}
          className="bg-white rounded-[18px] border border-[#edf2f7] px-4 py-3.5 mb-2.5 flex-row items-center justify-between"
          style={HOME_CARD_SHADOW}
        >
          <View className="flex-1 pr-3">
            <ShimmerBox
              className="h-4 rounded-md"
              style={{ width: row.titleWidth }}
            />
            <ShimmerBox className="w-32 h-3 rounded-full mt-2" />
          </View>
          <View className="flex-row items-center gap-2 shrink-0">
            <ShimmerBox
              className="h-6 rounded-full"
              style={{ width: row.pillWidth }}
            />
            <ShimmerBox className="w-2 h-3 rounded-full" />
          </View>
        </View>
      ))}
    </View>
  </SkeletonGroup>
);

export const TransactionsScreen: React.FC = () => {
  const {
    navigateTo,
    transactionFilter,
    setTransactionFilter,
  } = useNavigationUi();
  const {
    orders,
    totalOrders,
    statusCounts,
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

  const activeCount =
    transactionFilter === 'ALL'
      ? totalOrders
      : (statusCounts[transactionFilter] ?? filteredOrders.length);
  const countLabel = `${activeCount} ${activeCount === 1 ? 'Order' : 'Orders'}`;

  useEffect(() => {
    if (
      !isLoading &&
      transactionFilter !== 'ALL' &&
      (statusCounts[transactionFilter] ?? 0) === 0
    ) {
      setTransactionFilter('ALL');
    }
  }, [isLoading, statusCounts, transactionFilter, setTransactionFilter]);

  const filterOptions = FILTERS.flatMap((filter) => {
    const count = filter === 'ALL' ? totalOrders : (statusCounts[filter] ?? 0);
    if (
      filter !== 'ALL' &&
      count === 0 &&
      !(isLoading && filter === transactionFilter)
    ) {
      return [];
    }
    return [
      {
        value: filter,
        label: getFilterLabel(filter),
        count,
        color: filter === 'ALL' ? '#2563eb' : getStatusTheme(filter).dotColor,
      },
    ];
  });

  const isInitialLoading = isLoading && orders.length === 0;

  return (
    <View className="flex-1 bg-[#2563eb]">
      <StatusBar style="light" />

      {/* Top Header */}
      <AppHeader
        title="Transactions"
        subtitle="ORDER HISTORY"
      />

      {/* Main Sheet with Curved Transition */}
      <View className="flex-1 bg-[#f8fafc] rounded-t-[32px] pt-5 overflow-hidden relative">
        <FilterDropdown
          value={transactionFilter}
          onChange={setTransactionFilter}
          accessibilityLabel="Filter orders"
          countLabel={countLabel}
          options={filterOptions}
        />

        {isInitialLoading ? (
          <TransactionsListSkeleton />
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 2,
              paddingBottom: 112,
            }}
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
              <View
                className="bg-white rounded-[24px] border border-[#edf2f7] py-12 px-6 items-center justify-center mt-1"
                style={HOME_CARD_SHADOW}
              >
                <View className="w-[72px] h-[72px] rounded-full bg-[#eff6ff] items-center justify-center mb-4">
                  <View className="w-[52px] h-[52px] rounded-full bg-[#dbeafe]/60 items-center justify-center">
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M20 7.5L12 3L4 7.5M20 7.5L12 12M20 7.5V16.5L12 21M12 12L4 7.5M12 12V21M4 7.5V16.5L12 21"
                        stroke="#2563eb"
                        strokeWidth={1.9}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                </View>

                <Text className="text-[16px] font-bold text-[#0f172a] text-center">
                  No orders yet
                </Text>
                <Text className="text-[12.5px] font-normal text-[#64748b] text-center mt-1.5 max-w-[240px] leading-[18px]">
                  Your registered parcels and pickup history will appear here.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigateTo('create_order')}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-[#2563eb]"
                >
                  <Text className="text-[12.5px] font-semibold text-white">
                    Register a Parcel
                  </Text>
                </TouchableOpacity>
              </View>
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View className="py-4 items-center justify-center">
                  <ActivityIndicator size="small" color="#2563eb" />
                </View>
              ) : undefined
            }
            renderItem={({ item: order }) => {
              const isPassActive =
                order.status === 'READY_TO_CLAIM' && Boolean(order.isClaimActive);
              const pillStyles = getStatusPillStyles(order.status);
              const formattedDate =
                formatOrderDate(order.timestamp) || 'Recent Order';
              const hasPrice =
                typeof order.price === 'number' && order.price > 0;
              const metaLine = hasPrice
                ? `${formattedDate}  ·  ₱${order.price!.toLocaleString('en-US')}`
                : formattedDate;

              return (
                <TouchableOpacity
                  activeOpacity={0.78}
                  onPress={() =>
                    navigateTo('order_details', {
                      orderId: order.id,
                      ticketCode: order.ticketCode,
                    })
                  }
                  className="bg-white rounded-[18px] border border-[#edf2f7] px-4 py-3.5 mb-2.5 flex-row items-center justify-between"
                  style={HOME_CARD_SHADOW}
                >
                  {/* Left: Product Name & Meta */}
                  <View className="flex-1 pr-3">
                    <Text
                      className="text-[14px] font-semibold text-[#0f172a] leading-[19px]"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {order.productName || 'Unknown Package'}
                    </Text>
                    <Text
                      className="text-[11.5px] font-medium text-[#64748b] mt-1"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {metaLine}
                    </Text>
                  </View>

                  {/* Right: Tinted Status Pill + Chevron */}
                  <View className="flex-row items-center gap-2 shrink-0">
                    <View
                      className="px-2.5 py-1 rounded-full items-center justify-center"
                      style={pillStyles.containerStyle}
                    >
                      <Text
                        className="text-[11px] font-semibold leading-[14px]"
                        style={{ color: pillStyles.textColor }}
                      >
                        {isPassActive
                          ? 'Pass Active'
                          : getStatusLabel(order.status)}
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
            }}
          />
        )}

        {/* Floating Bottom Nav inside the Main Sheet */}
        <BottomNav activeTab="transactions" />
      </View>
    </View>
  );
};

export default TransactionsScreen;
