import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { StaffOrder, StaffTab } from '../../types';
import { StaffOrderCard } from './StaffOrderCard';
import { ChevronDown, Inbox } from '../common/Icons';

interface StaffOrdersListProps {
  orders: StaffOrder[];
  allOrders: StaffOrder[];
  activeTab: StaffTab;
  searchQuery: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onSelectOrder: (order: StaffOrder) => void;
  onSelectTab: (tab: StaffTab) => void;
}

export const StaffOrdersList: React.FC<StaffOrdersListProps> = ({
  orders,
  allOrders,
  activeTab,
  searchQuery,
  isRefreshing,
  onRefresh,
  onSelectOrder,
}) => {
  const [sortAscending, setSortAscending] = useState<boolean>(false);

  // Sorting
  const sortedOrders = [...orders].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return sortAscending ? timeA - timeB : timeB - timeA;
  });

  const toggleSort = () => {
    setSortAscending((prev) => !prev);
  };

  return (
    <View className="flex-1 px-5">
      {/* Subheader: Record Count & Sort by Date matching home.png */}
      <View className="flex-row items-center justify-between py-2 px-1">
        <Text className="text-xs text-[#64748B] font-medium">
          Displaying {orders.length} of {allOrders.length} records
        </Text>

        <TouchableOpacity
          onPress={toggleSort}
          className="flex-row items-center gap-1 active:opacity-70"
        >
          <Text className="text-xs font-semibold text-[#215CD4]">
            Sort by Date
          </Text>
          <ChevronDown
            size={13}
            color="#215CD4"
            style={{ transform: [{ rotate: sortAscending ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <FlatList
        data={sortedOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StaffOrderCard order={item} onPress={onSelectOrder} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 90, // safe space for bottom nav
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#215CD4"
            colors={['#215CD4']}
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-16">
            <View className="w-14 h-14 rounded-2xl bg-[#F1F5F9] items-center justify-center mb-3">
              <Inbox size={26} color="#94A3B8" />
            </View>
            <Text className="text-sm font-bold text-[#0F172A]">
              No {activeTab} records
            </Text>
            <Text className="text-xs text-[#64748B] text-center mt-1 max-w-[240px]">
              {searchQuery
                ? `No orders matching "${searchQuery}"`
                : activeTab === 'unpaid'
                ? 'No recent unpaid orders placed within the last 5 minutes.'
                : `There are currently no items under the ${activeTab} queue.`}
            </Text>
          </View>
        }
      />
    </View>
  );
};
