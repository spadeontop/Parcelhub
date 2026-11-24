import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigationUi } from '../../context/NavigationAndUiContext';
import { useToast } from '../../context/ToastContext';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useCustomerOrders } from '../../hooks/useCustomerOrders';
import { BottomNav } from '../layout/BottomNav';
import { AppHeader } from '../layout/AppHeader';
import { ActiveParcelCard } from '../home/ActiveParcelCard';
import { getStatusLabel } from '../../utils/statusHelpers';
import { CustomerOrderSummary } from '../../types/api';

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
    activeOrders,
    spotlightOrder,
    otherActiveOrders,
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
    const others = spotlight
      ? active.filter((o) => o.id !== spotlight.id).slice(0, 2)
      : [];

    return {
      activeOrders: active,
      spotlightOrder: spotlight,
      otherActiveOrders: others,
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

  const statusSubtitle = useMemo(() => {
    if (readyCount > 0) {
      return readyCount === 1
        ? '1 parcel ready to claim'
        : `${readyCount} parcels ready to claim`;
    }
    if (unpaidCount > 0) {
      return unpaidCount === 1
        ? '1 order awaiting payment'
        : `${unpaidCount} orders awaiting payment`;
    }
    if (awaitingCount > 0) {
      return awaitingCount === 1
        ? '1 parcel on the way'
        : `${awaitingCount} parcels on the way`;
    }
    return 'All caught up';
  }, [awaitingCount, readyCount, unpaidCount]);

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
          contentContainerStyle={{ paddingTop: 24, paddingBottom: 112 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563eb']}
            />
          }
        >
          {/* Crisp Editorial Greeting */}
          <View className="mb-5">
            <Text className="text-[26px] font-bold text-[#0f172a] tracking-tight">
              Hi, {displayName}
            </Text>
            <Text className="text-[13px] font-medium text-[#64748b] mt-0.5">
              {statusSubtitle}
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

          {/* Balanced Action Tile Pair */}
          <View className="flex-row gap-3 mb-5">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCreateOrder}
              className="flex-1 rounded-[20px] bg-white border border-[#e2e8f0] p-4 justify-between min-h-[92px]"
              style={{ opacity: isBlacklisted ? 0.5 : 1 }}
            >
              <Text className="text-[15px] font-bold text-[#2563eb]">
                + New Order
              </Text>
              <Text className="text-[12px] font-medium text-[#64748b] mt-3">
                Register parcel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigateTo('transactions', { filter: 'ALL' })}
              className="flex-1 rounded-[20px] bg-white border border-[#e2e8f0] p-4 justify-between min-h-[92px]"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-[15px] font-bold text-[#0f172a]">
                  Orders
                </Text>
                <Svg width={6} height={10} viewBox="0 0 6 10" fill="none">
                  <Path
                    d="M0.75 0.75L4.85 4.85L0.75 8.95"
                    stroke="#94a3b8"
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text className="text-[12px] font-medium text-[#64748b] mt-3">
                {activeOrders.length > 0
                  ? `${activeOrders.length} active · ${orders.length} total`
                  : `${orders.length} total`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Other Active Parcels (only if 2+ active parcels exist) */}
          {otherActiveOrders.length > 0 && (
            <View>
              <View className="flex-row items-center justify-between mb-2.5 px-1">
                <Text className="text-[12px] font-semibold text-[#64748b]">
                  In Progress
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigateTo('transactions', { filter: 'ALL' })}
                >
                  <Text className="text-[12px] font-semibold text-[#2563eb]">
                    View all
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="bg-white rounded-[20px] border border-[#e2e8f0] px-4 py-1">
                {otherActiveOrders.map((order, idx) => (
                  <TouchableOpacity
                    key={order.id}
                    activeOpacity={0.7}
                    onPress={() => openOrder(order)}
                    className="py-3.5 flex-row items-center justify-between"
                    style={
                      idx !== 0
                        ? { borderTopWidth: 1, borderTopColor: '#f1f5f9' }
                        : undefined
                    }
                  >
                    <Text
                      className="flex-1 pr-3 text-[14px] font-semibold text-[#0f172a]"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {order.productName}
                    </Text>
                    <View className="flex-row items-center gap-2 shrink-0">
                      <Text
                        className="text-[12px] font-semibold"
                        style={{
                          color:
                            order.status === 'READY_TO_CLAIM'
                              ? '#059669'
                              : '#64748b',
                        }}
                      >
                        {getStatusLabel(order.status)}
                      </Text>
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
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Floating Bottom Nav */}
        <BottomNav activeTab="home" />
      </View>
    </View>
  );
};

export default HomeScreen;
