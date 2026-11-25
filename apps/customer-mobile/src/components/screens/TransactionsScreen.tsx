import React, { useEffect, useMemo, useState } from 'react';
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
import { CustomerOrderSummary } from '../../types/api';

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

const SKELETON_GROUPS = [
  { headerWidth: 54, rows: ['72%', '56%', '66%'] },
  { headerWidth: 96, rows: ['64%', '78%'] },
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

interface OrderDateGroup {
  key: string;
  title: string;
  isRecentDay: boolean;
  items: CustomerOrderSummary[];
}

function getDateGroupMeta(isoTimestamp?: string | null): {
  key: string;
  title: string;
  isRecentDay: boolean;
} {
  if (!isoTimestamp) {
    return { key: 'recent', title: 'Recent', isRecentDay: false };
  }
  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) {
    return { key: 'recent', title: 'Recent', isRecentDay: false };
  }

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) {
    return { key: 'today', title: 'Today', isRecentDay: true };
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) {
    return { key: 'yesterday', title: 'Yesterday', isRecentDay: true };
  }

  const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const title = date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  return { key: monthKey, title, isRecentDay: false };
}

function formatCompactTimestamp(
  isoTimestamp: string | null | undefined,
  isRecentDay: boolean
): string {
  if (!isoTimestamp) return 'Just now';
  const date = new Date(isoTimestamp);
  if (isNaN(date.getTime())) return 'Recently';

  if (isRecentDay) {
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

const TransactionsListSkeleton: React.FC = () => (
  <SkeletonGroup enabled>
    <View
      className="px-5"
      accessibilityLabel="Loading orders"
      accessibilityState={{ busy: true }}
    >
      {SKELETON_GROUPS.map((group, gIdx) => (
        <View key={gIdx} className="mb-5">
          <ShimmerBox
            className="h-3 rounded-full mb-2.5 ml-1"
            style={{ width: group.headerWidth }}
          />
          <View
            className="bg-white rounded-[20px] border border-[#edf2f7] px-4 py-1"
            style={HOME_CARD_SHADOW}
          >
            {group.rows.map((titleWidth, rIdx) => (
              <View
                key={rIdx}
                className="py-3.5 flex-row items-center justify-between"
                style={
                  rIdx !== 0
                    ? { borderTopWidth: 1, borderTopColor: '#f1f5f9' }
                    : undefined
                }
              >
                <View className="flex-1 pr-3">
                  <ShimmerBox
                    className="h-4 rounded-md"
                    style={{ width: titleWidth }}
                  />
                  <View className="flex-row items-center gap-2.5 mt-2">
                    <ShimmerBox className="w-16 h-5 rounded-full" />
                    <ShimmerBox className="w-14 h-3 rounded-full" />
                  </View>
                </View>
                <ShimmerBox className="w-12 h-4 rounded-md shrink-0" />
              </View>
            ))}
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

  const filteredOrders = useMemo(
    () =>
      transactionFilter === 'ALL'
        ? orders
        : orders.filter((o) => o.status === transactionFilter),
    [orders, transactionFilter]
  );

  const groupedOrders = useMemo<OrderDateGroup[]>(() => {
    const groups: OrderDateGroup[] = [];
    const byKey = new Map<string, OrderDateGroup>();

    for (const order of filteredOrders) {
      const meta = getDateGroupMeta(order.timestamp);
      let group = byKey.get(meta.key);
      if (!group) {
        group = {
          key: meta.key,
          title: meta.title,
          isRecentDay: meta.isRecentDay,
          items: [],
        };
        byKey.set(meta.key, group);
        groups.push(group);
      }
      group.items.push(order);
    }

    return groups;
  }, [filteredOrders]);

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
  const countLabel = `${activeCount} ${activeCount === 1 ? 'order' : 'orders'}`;

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
        color: filter === 'ALL' ? '#64748b' : getStatusTheme(filter).dotColor,
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
            data={groupedOrders}
            keyExtractor={(group) => group.key}
            showsVerticalScrollIndicator={false}
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 20,
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
                className="bg-white rounded-[20px] border border-[#edf2f7] py-12 px-6 items-center justify-center"
                style={HOME_CARD_SHADOW}
              >
                <View className="w-[68px] h-[68px] rounded-full bg-[#eff6ff] items-center justify-center mb-4">
                  <View className="w-[48px] h-[48px] rounded-full bg-[#dbeafe]/60 items-center justify-center">
                    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
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
            renderItem={({ item: group }) => (
              <View className="mb-5">
                {/* Date Section Header (consistent with HomeScreen) */}
                <Text className="text-[11.5px] font-bold text-[#64748b] uppercase tracking-[0.6px] mb-2 px-1">
                  {group.title}
                </Text>

                {/* Grouped Minimalist Feed Card (consistent with HomeScreen Recent Activity) */}
                <View
                  className="bg-white rounded-[20px] border border-[#edf2f7] px-4 py-1"
                  style={HOME_CARD_SHADOW}
                >
                  {group.items.map((order, idx) => {
                    const pillStyles = getStatusPillStyles(order.status);
                    const isPassActive =
                      order.status === 'READY_TO_CLAIM' &&
                      Boolean(order.isClaimActive);
                    const statusText = isPassActive
                      ? 'Pass Active'
                      : getStatusLabel(order.status);
                    const timeLabel = formatCompactTimestamp(
                      order.timestamp,
                      group.isRecentDay
                    );
                    const hasPrice =
                      typeof order.price === 'number' && order.price > 0;

                    return (
                      <TouchableOpacity
                        key={order.id}
                        activeOpacity={0.72}
                        onPress={() =>
                          navigateTo('order_details', {
                            orderId: order.id,
                            ticketCode: order.ticketCode,
                          })
                        }
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

                        <View className="flex-row items-center gap-2 shrink-0">
                          {hasPrice && (
                            <Text className="text-[14px] font-semibold text-[#0f172a]">
                              ₱{order.price!.toLocaleString('en-US')}
                            </Text>
                          )}
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
            )}
          />
        )}

        {/* Floating Bottom Nav inside the Main Sheet */}
        <BottomNav activeTab="transactions" />
      </View>
    </View>
  );
};

export default TransactionsScreen;
