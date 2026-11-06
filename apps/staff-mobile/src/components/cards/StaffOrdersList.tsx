import React from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { StaffOrder, StaffTab } from '../../types';
import { StaffOrderCard } from './StaffOrderCard';
import { Package, Search } from '../common/Icons';

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
  onSelectTab,
}) => {
  // Check for cross-tab matches when search query returns no results in active tab
  const crossTabMatches = React.useMemo(() => {
    if (!searchQuery.trim() || orders.length > 0) return [];
    const q = searchQuery.trim().toLowerCase();
    return allOrders.filter((o) => {
      const id = o.id.toLowerCase();
      const track = o.trackingId.toLowerCase();
      const cust = o.customer.toLowerCase();
      const prod = (o.productName || '').toLowerCase();
      return id.includes(q) || track.includes(q) || cust.includes(q) || prod.includes(q);
    });
  }, [allOrders, orders.length, searchQuery]);

  const renderEmptyState = () => {
    if (searchQuery.trim() && crossTabMatches.length > 0) {
      return (
        <View className="py-10 px-4 items-center">
          <View className="w-12 h-12 rounded-2xl bg-blue-500/10 items-center justify-center mb-3">
            <Search size={22} color="#60a5fa" />
          </View>
          <Text className="text-white font-bold text-sm text-center mb-1">
            Found in Other Queues
          </Text>
          <Text className="text-slate-400 text-xs text-center mb-4">
            No match in current tab, but found {crossTabMatches.length} matching order(s):
          </Text>
          <View className="w-full gap-2">
            {crossTabMatches.map((matched) => (
              <TouchableOpacity
                key={matched.id}
                onPress={() => onSelectOrder(matched)}
                className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex-row items-center justify-between"
              >
                <View>
                  <Text className="text-white font-bold text-xs">{matched.id} • {matched.trackingId}</Text>
                  <Text className="text-slate-400 text-[10px]">{matched.customer} • Status: {matched.status}</Text>
                </View>
                <Text className="text-blue-400 font-semibold text-xs">View -{'>'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    return (
      <View className="py-16 px-4 items-center justify-center">
        <View className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 items-center justify-center mb-3">
          <Package size={26} color="#64748b" />
        </View>
        <Text className="text-slate-200 font-bold text-sm text-center mb-1">
          {searchQuery ? 'No Orders Found' : 'No Orders In This Queue'}
        </Text>
        <Text className="text-slate-400 text-xs text-center max-w-[240px]">
          {searchQuery
            ? `No records match "${searchQuery}". Check tracking number or search another queue.`
            : 'Incoming orders and customer claims will appear here live.'}
        </Text>
      </View>
    );
  };

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <StaffOrderCard order={item} onPress={onSelectOrder} />
      )}
      contentContainerStyle={{ padding: 12, paddingBottom: 90, flexGrow: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#3b82f6"
          colors={['#3b82f6']}
        />
      }
      ListEmptyComponent={renderEmptyState}
    />
  );
};
