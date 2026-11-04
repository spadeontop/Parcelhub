import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { BrandHeader } from '../layout/BrandHeader';
import { BottomNav } from '../layout/BottomNav';
import { ChevronRightIcon } from '../common/Icons';
import { getStatusLabel, getStatusTextColor, getStatusDotClass } from '../../utils/statusHelpers';
import Svg, { Path } from 'react-native-svg';

export const HomeScreen: React.FC = () => {
  const { hasOrders, setHasOrders, orders, navigateTo } = useApp();

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }} className="flex-1 bg-white px-5 pt-3 pb-2">
      {/* Brand Header */}
      <BrandHeader />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Welcome Dark Card */}
        <View className="mt-3 rounded-3xl bg-[#1e1e1e] p-6 shadow-lg">
          <Text className="text-2xl font-bold tracking-tight text-white">
            Welcome Nyeowsz!
          </Text>
          <Text className="text-sm text-gray-400 mt-1">
            Create an order to get started
          </Text>

          <View className="flex-row items-center gap-3 mt-6">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigateTo('create_order')}
              className="flex-1 py-3 px-4 rounded-xl bg-[#215cd4] active:bg-[#194cb5] shadow-md items-center"
            >
              <Text className="text-white font-bold text-xs tracking-wide">
                + Create Order
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigateTo('transactions')}
              className="flex-1 py-3 px-4 rounded-xl bg-[#163b86] active:bg-[#102d6b] items-center"
            >
              <Text className="text-white font-bold text-xs tracking-wide">
                Transactions
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activities Section */}
        <View className="mt-6 flex-1">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-900">Activities</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setHasOrders(!hasOrders)}
            >
              <Text className="text-xs text-[#215cd4] font-semibold">
                Switch to {hasOrders ? 'Zero' : 'Active'} orders view
              </Text>
            </TouchableOpacity>
          </View>

          {!hasOrders ? (
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
            /* With Orders List Container */
            <View className="rounded-3xl bg-[#f8f8f8] border border-gray-100 p-4 mb-4">
              {orders.map((order, idx) => (
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
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <BottomNav activeTab="home" />
    </View>
  );
};

