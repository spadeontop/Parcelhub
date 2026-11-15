import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { useApp } from '../../context/AppContext';
import { TransactionFilter } from '../../types';
import { BottomNav } from '../layout/BottomNav';
import { getStatusTheme } from '../../utils/statusHelpers';

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
  const { orders, transactionFilter, setTransactionFilter, navigateTo, refetchOrders } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const { height } = useWindowDimensions();
  const isCompact = height < 700;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchOrders(transactionFilter);
    setRefreshing(false);
  };

  const filteredOrders =
    transactionFilter === 'ALL'
      ? orders
      : orders.filter((o) => o.status === transactionFilter);

  return (
    <View className="flex-1 bg-[#2563eb]">
      <StatusBar style="light" />

      {/* Top Header (Signature Curved Blue Header) */}
      <View
        className="bg-[#2563eb] px-5"
        style={{
          paddingTop: isCompact ? 14 : 24,
          paddingBottom: isCompact ? 20 : 28,
        }}
      >
        <View className="flex-row items-center justify-between">
          {/* Header Title & Subtitle */}
          <View>
            <Text className="text-[20px] font-bold text-white tracking-tight leading-[26px]">
              Transactions
            </Text>
            <Text className="text-[11px] font-bold text-[#dbeafe] uppercase tracking-wider mt-1">
              ORDER HISTORY
            </Text>
          </View>

          {/* Help Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigateTo('faq')}
            className="w-9 h-9 rounded-full bg-white/20 items-center justify-center border border-white/20"
            accessibilityLabel="Help"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                stroke="#ffffff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Sheet with Curved Transition */}
      <View className="flex-1 bg-[#f8fafc] rounded-t-[32px] pt-4">
        {/* Filter Pills */}
        <View className="mb-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {FILTERS.map((f) => {
              const isSelected = transactionFilter === f;
              return (
                <TouchableOpacity
                  key={f}
                  activeOpacity={0.7}
                  onPress={() => setTransactionFilter(f)}
                  className={`px-4 py-2 rounded-full ${
                    isSelected
                      ? 'bg-[#2563eb]'
                      : 'bg-white border border-[#e2e8f0]'
                  }`}
                  style={
                    isSelected
                      ? {
                          shadowColor: '#2563eb',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 4,
                          elevation: 2,
                        }
                      : undefined
                  }
                >
                  <Text
                    className={`text-xs ${
                      isSelected
                        ? 'font-bold text-white'
                        : 'font-semibold text-[#475569]'
                    }`}
                  >
                    {getFilterLabel(f)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Orders List Container */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563eb']}
            />
          }
        >
          {/* Transactions Card Wrapper */}
          <View
            className="rounded-[24px] bg-white border border-[#f1f5f9] mb-4 overflow-hidden"
            style={{
              shadowColor: '#0f172a',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            {/* Card Header */}
            <View className="flex-row items-center justify-between px-5 pt-4 pb-3.5 border-b border-[#f1f5f9]">
              <Text className="text-[11px] font-bold tracking-wider text-[#64748b] uppercase">
                ALL TRANSACTIONS
              </Text>
              <Text className="text-[11px] font-bold text-[#2563eb]">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
              </Text>
            </View>

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
                    onPress={() => navigateTo('order_details', { orderId: order.id })}
                    className={`flex-row items-center justify-between ${
                      !isLast ? 'border-b border-[#f1f5f9]' : ''
                    }`}
                    style={{
                      paddingVertical: 18,
                      paddingHorizontal: 20,
                    }}
                  >
                    {/* Left: Product Name & Date */}
                    <View className="flex-1 pr-3">
                      <Text
                        className="text-[13px] font-bold text-[#1e293b] leading-[18px]"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {order.product || 'Unknown Package'}
                      </Text>
                      <Text className="text-[11px] font-normal text-[#94a3b8] leading-[16px] mt-1">
                        {order.dateLabel || 'Recent Order'}
                      </Text>
                    </View>

                    {/* Right: Status Dot + Label + Chevron */}
                    <View className="flex-row items-center gap-2 shrink-0">
                      <View
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 3.5,
                          backgroundColor: statusTheme.dotColor,
                        }}
                      />
                      <Text
                        style={{ color: statusTheme.textColor }}
                        className="text-[11.5px] font-bold leading-[16px]"
                      >
                        {statusTheme.label}
                      </Text>
                      <Svg
                        width={6}
                        height={11}
                        viewBox="0 0 6 11"
                        fill="none"
                        style={{ marginLeft: 2 }}
                      >
                        <Path
                          d="M0.7 0.7L5.3 5.3L0.7 10"
                          stroke="#94a3b8"
                          strokeWidth={1.4}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Floating Bottom Nav inside the Main Sheet */}
        <BottomNav activeTab="transactions" />
      </View>
    </View>
  );
};

export default TransactionsScreen;
