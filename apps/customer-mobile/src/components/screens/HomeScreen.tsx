import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useApp } from '../../context/AppContext';
import { BrandHeader } from '../layout/BrandHeader';
import { BottomNav } from '../layout/BottomNav';
import { ChevronRightIcon } from '../common/Icons';
import { getStatusLabel, getStatusTextColor, getStatusDotClass } from '../../utils/statusHelpers';
import Svg, { Path } from 'react-native-svg';

export const HomeScreen: React.FC = () => {
  const { hasOrders, orders, navigateTo, refetchOrders } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchOrders();
    setRefreshing(false);
  };

  const isOrderListEmpty = !hasOrders || orders.length === 0;
  const recentOrders = orders.slice(0, 5);

  const readyCount = orders.filter((o) => o.status === 'READY_TO_CLAIM').length;
  const inTransitCount = orders.filter((o) => o.status === 'AWAITING_PARCEL').length;
  const unpaidCount = orders.filter((o) => o.status === 'PAYMENT_REQUIRED').length;

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }} className="flex-1 bg-white px-5 pt-3 pb-2">
      {/* Brand Header */}
      <BrandHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#215cd4']} />}
      >
        {/* Welcome Dark Card */}
        <View className="mt-3 rounded-3xl bg-[#181b20] p-5 shadow-lg">
          {/* Status Pills inside Card (above Welcome) */}
          <View className="flex-row items-center gap-2 mb-2.5">
            {/* Ready */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigateTo('transactions')}
              className="flex-row items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/5"
            >
              <View className="w-1.5 h-1.5 rounded-full bg-[#10b780]" />
              <Text className="text-[10px] font-medium text-gray-300">
                {readyCount} Ready
              </Text>
            </TouchableOpacity>

            {/* In Transit */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigateTo('transactions')}
              className="flex-row items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/5"
            >
              <View className="w-1.5 h-1.5 rounded-full bg-[#1b65e8]" />
              <Text className="text-[10px] font-medium text-gray-300">
                {inTransitCount} In Transit
              </Text>
            </TouchableOpacity>

            {/* Unpaid */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigateTo('transactions')}
              className="flex-row items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/5"
            >
              <View className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
              <Text className="text-[10px] font-medium text-gray-300">
                {unpaidCount} Unpaid
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-2xl font-bold tracking-tight text-white">
            Welcome Nyeowsz!
          </Text>
          <Text className="text-sm text-gray-400 mt-1">
            Create an order or track existing deliveries
          </Text>

          <View className="mt-4 flex-row">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigateTo('create_order')}
              style={{
                flex: 1,
                backgroundColor: '#1b65e8',
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
              }}
              className="active:opacity-90 shadow-sm"
            >
              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600' }}>
                + Create Order
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activities Section */}
        <View className="mt-6 flex-1">
          <View className="mb-3">
            <Text className="text-lg font-bold text-gray-900">Activities</Text>
          </View>

          {isOrderListEmpty ? (
            /* Zero Orders Empty State Box */
            <View className="min-h-[300px] rounded-3xl bg-[#f8f8f8] border border-gray-100 items-center justify-center p-6">
              <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-3">
                <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
                  <Path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    stroke="#215cd4"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </Svg>
              </View>
              <Text className="text-gray-800 text-sm font-semibold text-center">
                You don’t have any activities yet
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigateTo('create_order')}
                className="mt-4 px-5 py-2.5 rounded-xl bg-[#215cd4] shadow-sm"
              >
                <Text className="text-white text-xs font-bold">
                  Create an order
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* With Orders List Container (Limited to 5) */
            <View className="rounded-3xl bg-[#f8f8f8] border border-gray-100 p-4 mb-4">
              {recentOrders.map((order, idx) => (
                <TouchableOpacity
                  key={order.id}
                  activeOpacity={0.7}
                  onPress={() => navigateTo('order_details', { orderId: order.id })}
                  className={`py-3.5 flex-row items-center justify-between ${
                    idx !== 0 ? 'border-t border-gray-200/70' : ''
                  }`}
                >
                  <View className="flex-1 pr-3">
                    <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                      {order.product}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {order.dateLabel}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-1.5">
                    <View
                      className={`w-2 h-2 rounded-full ${getStatusDotClass(
                        order.status
                      )}`}
                    />
                    <Text
                      className={`text-xs font-bold ${getStatusTextColor(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </Text>
                    <ChevronRightIcon size={14} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
              ))}

              {/* View All link below the list */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigateTo('transactions')}
                className="mt-1 pt-3.5 border-t border-gray-200/70 flex-row items-center justify-center gap-1.5"
              >
                <Text className="text-xs font-bold text-[#1b65e8]">
                  View all activities
                </Text>
                <ChevronRightIcon size={13} color="#1b65e8" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <BottomNav activeTab="home" />
    </View>
  );
};
