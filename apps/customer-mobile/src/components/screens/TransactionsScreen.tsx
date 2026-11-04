import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { TransactionFilter } from '../../types';
import { BrandHeader } from '../layout/BrandHeader';
import { BottomNav } from '../layout/BottomNav';
import { ChevronRightIcon } from '../common/Icons';
import { getStatusLabel, getStatusTextColor, getStatusDotClass } from '../../utils/statusHelpers';

const FILTERS: TransactionFilter[] = ['ALL', 'READY_TO_CLAIM', 'AWAITING_PARCEL', 'PAYMENT_REQUIRED', 'CLAIMED'];

export const TransactionsScreen: React.FC = () => {
  const { orders, transactionFilter, setTransactionFilter, navigateTo } = useApp();

  const filteredOrders =
    transactionFilter === 'ALL'
      ? orders
      : orders.filter((o) => o.status === transactionFilter);

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }} className="flex-1 bg-white px-5 pt-3 pb-2">
      {/* Header */}
      <BrandHeader title="Transactions" subtitle="ORDER HISTORY" showBack={false} showLogo={false} showProfile={false} />

      {/* Filter Pills */}
      <View className="py-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              activeOpacity={0.7}
              onPress={() => setTransactionFilter(f)}
              className={`px-3.5 py-1.5 rounded-full mr-2 ${
                transactionFilter === f
                  ? 'bg-[#1b65e8]'
                  : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  transactionFilter === f ? 'text-white' : 'text-gray-600'
                }`}
              >
                {f === 'ALL' ? 'All Orders' : getStatusLabel(f)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List Container */}
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 mt-2">
        <View className="rounded-3xl bg-[#f8f8f8] border border-gray-100 p-4 mb-4">
          {filteredOrders.length === 0 ? (
            <View className="py-12 items-center">
              <Text className="text-xs text-gray-400">
                No orders found matching this filter.
              </Text>
            </View>
          ) : (
            filteredOrders.map((order, idx) => (
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
                  <View className={`w-2 h-2 rounded-full ${getStatusDotClass(order.status)}`} />
                  <Text className={`text-xs font-bold ${getStatusTextColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </Text>
                  <ChevronRightIcon size={14} color="#9ca3af" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <BottomNav activeTab="transactions" />
    </View>
  );
};

