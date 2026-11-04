import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { BrandHeader } from '../layout/BrandHeader';
import { BottomNav } from '../layout/BottomNav';
import { ChevronRightIcon } from '../common/Icons';
import { getStatusLabel, getStatusTextColor, getStatusDotClass } from '../../utils/statusHelpers';
import Svg, { Path } from 'react-native-svg';

export const HomeScreen: React.FC = () => {
  const { hasOrders, orders, navigateTo } = useApp();

  const isOrderListEmpty = !hasOrders || orders.length === 0;
  const recentOrders = orders.slice(0, 5);

  const readyCount = orders.filter((o) => o.status === 'READY_TO_CLAIM').length;
  const inTransitCount = orders.filter((o) => o.status === 'AWAITING_PARCEL').length;
  const unpaidCount = orders.filter((o) => o.status === 'PAYMENT_REQUIRED').length;

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }} className="flex-1 bg-white px-5 pt-3 pb-2">
      {/* Brand Header */}
      <BrandHeader />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Welcome Dark Card */}
        <View className="mt-3 rounded-3xl bg-[#1e1e1e] p-6 shadow-lg">
          {/* Status Pills inside Card (above Welcome) */}
          <View className="flex-row items-center gap-2 mb-3">
            {/* Ready */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigateTo('transactions')}
              className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/5"
            >
              <View className="w-1.5 h-1.5 rounded-full bg-[#10b780]" />
              <Text className="text-[11px] font-semibold text-gray-200">
                {readyCount} Ready
              </Text>
            </TouchableOpacity>

            {/* In Transit */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigateTo('transactions')}
              className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/5"
            >
              <View className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
              <Text className="text-[11px] font-semibold text-gray-200">
                {inTransitCount} In Transit
              </Text>
            </TouchableOpacity>

            {/* Unpaid */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigateTo('transactions')}
              className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/5"
            >
              <View className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
              <Text className="text-[11px] font-semibold text-gray-200">
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

          <View className="mt-5">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigateTo('create_order')}
              className="w-full py-3.5 px-4 rounded-xl bg-[#215cd4] active:bg-[#194cb5] shadow-md items-center justify-center"
            >
              <Text className="text-white font-bold text-sm tracking-wide">
                + Create Order
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activities Section */}
        <View className="mt-6 flex-1">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-900">Activities</Text>
            {orders.length > 5 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigateTo('transactions')}
              >
                <Text className="text-xs text-[#215cd4] font-semibold">
                  View All ({orders.length})
                </Text>
              </TouchableOpacity>
            )}
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

              {orders.length > 5 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigateTo('transactions')}
                  className="pt-3 mt-1 border-t border-gray-200/70 items-center"
                >
                  <Text className="text-xs font-semibold text-[#215cd4]">
                    See all {orders.length} activities in Transactions →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <BottomNav activeTab="home" />
    </View>
  );
};
