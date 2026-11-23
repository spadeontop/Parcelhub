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
import { useNavigationUi } from '../../v1/context/NavigationAndUiContext';
import { useToast } from '../../v1/context/ToastContext';
import { useAuthSession } from '../../v1/context/AuthSessionContext';
import { useCustomerOrders } from '../../v1/hooks/useCustomerOrders';
import { formatOrderDate } from '../../v1/utils/date';
import { BottomNav } from '../layout/BottomNav';
import { AppHeader } from '../layout/AppHeader';
import { getStatusLabel, getStatusPillStyles } from '../../utils/statusHelpers';

export const HomeScreen: React.FC = () => {
  const { navigateTo } = useNavigationUi();
  const { showToast } = useToast();
  const { customer, refetchProfile } = useAuthSession();
  const { orders, refetchOrders } = useCustomerOrders();
  const [refreshing, setRefreshing] = useState(false);
  const { height } = useWindowDimensions();
  const isCompact = height < 700;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchOrders(), refetchProfile()]);
    setRefreshing(false);
  };

  const isOrderListEmpty = !orders || orders.length === 0;
  const recentOrders = orders.slice(0, 5);

  const displayName = customer?.firstName || 'Customer';
  const isBlacklisted = Boolean(customer?.blacklisted);

  const handleCreateOrder = () => {
    if (isBlacklisted) {
      showToast(
        customer?.blacklistReason || 'Your account is suspended from creating new orders.'
      );
      return;
    }
    navigateTo('create_order');
  };

  return (
    <View className="flex-1 bg-[#2563eb]">
      {/* Top Header */}
      <AppHeader
        title="ParcelHub"
        subtitle="LILY'S CATERING HUB"
        showLogo
        statusDotColor="#10b981"
      />

      {/* Main Sheet with Curved Transition */}
      <View className="flex-1 bg-[#f8fafc] rounded-t-[32px] pt-4 overflow-hidden relative">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 96 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563eb']}
            />
          }
        >
          {/* Welcome Card */}
          <View
            className="rounded-[20px] bg-[#f8fafc] p-4 mb-4"
            style={{
              paddingTop: 12,
              paddingBottom: 16,
            }}
          >
            {/* Greeting & Subtitle */}
            <Text className="text-[22px] font-bold text-[#1e1e1e] tracking-tight">
              Welcome {displayName}!
            </Text>
            <Text className="text-[13px] font-normal text-[#94a3b8] mt-1 mb-4">
              Create an order or track existing deliveries
            </Text>

            {/* Create Order Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCreateOrder}
              className={`w-full h-12 rounded-xl bg-[#2563eb] items-center justify-center flex-row ${
                isBlacklisted ? 'opacity-60' : ''
              }`}
            >
              <Text className="text-white text-[14px] font-bold">
                + Create Order
              </Text>
            </TouchableOpacity>
          </View>

          {/* Activities Section */}
          <View className="mb-4">
            <View className="px-1 mb-2">
              <Text className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-[0.55px]">
                RECENT ACTIVITIES
              </Text>
            </View>

            {isOrderListEmpty ? (
              /* Zero Orders Empty State Box */
              <View className="min-h-[220px] rounded-[16px] bg-white border border-[#f3f4f6] items-center justify-center p-6 shadow-xs">
                <View className="w-14 h-14 rounded-full bg-blue-50 items-center justify-center mb-3">
                  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                    <Path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      stroke="#2563eb"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </Svg>
                </View>
                <Text className="text-gray-800 text-[13px] font-semibold text-center">
                  You don’t have any activities yet
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleCreateOrder}
                  className={`mt-3 px-4 py-2 rounded-xl bg-[#2563eb] ${
                    isBlacklisted ? 'opacity-60' : ''
                  }`}
                >
                  <Text className="text-white text-[12px] font-bold">
                    Create an order
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Elevated Activities List Card Wrapper */
              <View
                className="bg-white rounded-[16px] border border-[rgba(243,244,246,0.8)] px-4 pt-3.5 pb-2 mb-2"
                style={{
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.04,
                  shadowRadius: 10,
                  elevation: 2,
                }}
              >
                {recentOrders.map((order, idx) => {
                  const pillStyles = getStatusPillStyles(order.status);
                  return (
                    <TouchableOpacity
                      key={order.id}
                      activeOpacity={0.7}
                      onPress={() =>
                        navigateTo('order_details', {
                          orderId: order.id,
                          ticketCode: order.ticketCode,
                        })
                      }
                      className={`py-3 flex-row items-center justify-between ${
                        idx !== 0 ? 'border-t border-[#f3f4f6]' : ''
                      }`}
                    >
                      {/* Left: Product Name (truncated) & Date */}
                      <View className="flex-1 pr-2.5">
                        <Text
                          className="text-[14px] font-semibold text-[#1e1e1e] leading-[20px]"
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {order.productName}
                        </Text>
                        <Text className="text-[12px] font-normal text-[#6b7280] leading-[16px] mt-0.5">
                          {formatOrderDate(order.timestamp)}
                        </Text>
                      </View>

                      {/* Right: Status Pill & Chevron */}
                      <View className="flex-row items-center gap-2 shrink-0">
                        <View
                          className="px-2.5 py-1 rounded-full items-center justify-center"
                          style={pillStyles.containerStyle}
                        >
                          <Text
                            className="text-[11px] font-medium leading-[16px]"
                            style={{ color: pillStyles.textColor }}
                          >
                            {getStatusLabel(order.status)}
                          </Text>
                        </View>
                        <Svg width={6} height={11} viewBox="0 0 6 11" fill="none">
                          <Path
                            d="M0.7 0.7L5.3 5.3L0.7 10"
                            stroke="#9ca3af"
                            strokeWidth={1.4}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Footer View All Action Link */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigateTo('transactions')}
                  className="pt-3.5 pb-2 border-t border-[#f3f4f6] flex-row items-center justify-center gap-1.5"
                >
                  <Text className="text-[12px] font-semibold text-[#2563eb] text-center tracking-[0.3px]">
                    View all activities
                  </Text>
                  <Svg width={6} height={10} viewBox="0 0 6 10" fill="none">
                    <Path
                      d="M0.75 0.75L4.85 4.85L0.75 8.95"
                      stroke="#2563eb"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Floating Bottom Nav inside the Main Sheet */}
        <BottomNav activeTab="home" />
      </View>
    </View>
  );
};

export default HomeScreen;
