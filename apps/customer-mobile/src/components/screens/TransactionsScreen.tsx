import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CARD_SHADOW } from '../common/cardStyles';
import { FilterPillBar, FilterPillOption } from '../common/FilterPillBar';
import { PackageIcon } from '../common/Icons';
import { AppHeader } from '../layout/AppHeader';
import { BottomNav } from '../layout/BottomNav';
import {
  OrderDateGroup,
  OrderDateGroupCard,
} from '../orders/OrderDateGroupCard';
import { TransactionsScreenSkeleton } from '../orders/TransactionsScreenSkeleton';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useNavigationUi } from '../../context/NavigationAndUiContext';
import { useToast } from '../../context/ToastContext';
import { useInfiniteCustomerOrders } from '../../hooks/useCustomerOrders';
import { CustomerOrderSummary, TransactionFilter } from '../../types/api';
import { getOrderDateGroupMeta } from '../../utils/date';
import { getStatusLabel } from '../../utils/statusHelpers';

export type { TransactionFilter };

const FILTERS: readonly TransactionFilter[] = [
  'ALL',
  'READY_TO_CLAIM',
  'AWAITING_PARCEL',
  'PAYMENT_REQUIRED',
  'CLAIMED',
  'CANCELLED',
  'REFUNDED',
];

const getFilterLabel = (filter: TransactionFilter): string =>
  filter === 'ALL' ? 'All' : getStatusLabel(filter);

export const TransactionsScreen: React.FC = () => {
  const {
    navigateTo,
    transactionFilter,
    setTransactionFilter,
  } = useNavigationUi();
  const { customer } = useAuthSession();
  const { showToast } = useToast();
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

  const isBlacklisted = Boolean(customer?.blacklisted);

  const filteredOrders = useMemo(
    () =>
      transactionFilter === 'ALL'
        ? orders
        : orders.filter((o) => o.status === transactionFilter),
    [orders, transactionFilter]
  );

  const groupedOrders = useMemo<readonly OrderDateGroup[]>(() => {
    const groups: Array<{
      key: string;
      title: string;
      isRecentDay: boolean;
      items: CustomerOrderSummary[];
    }> = [];
    const byKey = new Map<string, (typeof groups)[number]>();

    for (const order of filteredOrders) {
      const meta = getOrderDateGroupMeta(order.timestamp);
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

  const handleOpenOrder = useCallback(
    (order: CustomerOrderSummary) => {
      navigateTo('order_details', {
        orderId: order.id,
        ticketCode: order.ticketCode,
      });
    },
    [navigateTo]
  );

  const handleCreateOrder = useCallback(() => {
    if (isBlacklisted) {
      showToast(
        customer?.blacklistReason ||
          'Your account is suspended from creating new orders.'
      );
      return;
    }
    navigateTo('create_order');
  }, [customer?.blacklistReason, isBlacklisted, navigateTo, showToast]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch {
      // Ignored for pull to refresh
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  useEffect(() => {
    if (
      !isLoading &&
      transactionFilter !== 'ALL' &&
      (statusCounts[transactionFilter] ?? 0) === 0
    ) {
      setTransactionFilter('ALL');
    }
  }, [isLoading, statusCounts, transactionFilter, setTransactionFilter]);

  const filterOptions = useMemo<readonly FilterPillOption<TransactionFilter>[]>(
    () =>
      FILTERS.flatMap((filter) => {
        const count =
          filter === 'ALL' ? totalOrders : (statusCounts[filter] ?? 0);
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
          },
        ];
      }),
    [isLoading, statusCounts, totalOrders, transactionFilter]
  );

  const isInitialLoading = isLoading && orders.length === 0;
  const headerSubtitle =
    !isInitialLoading && totalOrders > 0
      ? `${totalOrders} ${totalOrders === 1 ? 'order' : 'orders'} total`
      : 'Order history';
  const showFilterBar = !isInitialLoading && filterOptions.length > 1;

  return (
    <View className="flex-1 bg-[#2563eb]">
      <StatusBar style="light" />

      {/* Top Header */}
      <AppHeader
        title="Transactions"
        subtitle={headerSubtitle}
        subtitleUppercase={false}
      />

      {/* Main Sheet with Curved Transition */}
      <View className="flex-1 bg-[#f8fafc] rounded-t-[32px] pt-4 overflow-hidden relative">
        {showFilterBar && (
          <FilterPillBar
            value={transactionFilter}
            options={filterOptions}
            onChange={setTransactionFilter}
            accessibilityLabel="Filter orders"
          />
        )}

        {isInitialLoading ? (
          <TransactionsScreenSkeleton />
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
                style={CARD_SHADOW}
              >
                <View className="w-[68px] h-[68px] rounded-full bg-[#eff6ff] items-center justify-center mb-4">
                  <View className="w-[48px] h-[48px] rounded-full bg-[#dbeafe]/60 items-center justify-center">
                    <PackageIcon size={22} color="#2563eb" />
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
                  onPress={handleCreateOrder}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-[#2563eb]"
                  style={{ opacity: isBlacklisted ? 0.5 : 1 }}
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
              <OrderDateGroupCard
                group={group}
                onPressOrder={handleOpenOrder}
              />
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
