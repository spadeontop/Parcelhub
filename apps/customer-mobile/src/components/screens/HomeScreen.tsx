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
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../layout/BottomNav';
import { getStatusLabel, getStatusPillStyles } from '../../utils/statusHelpers';

export const HomeScreen: React.FC = () => {
  const { hasOrders, orders, navigateTo, refetchOrders, authCustomer } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const { height } = useWindowDimensions();
  const isCompact = height < 700;

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

  const displayName = authCustomer?.firstname || 'John';

  return (
    <View className="flex-1 bg-[#2563eb]">
      {/* Top Header (Signature Curved Blue Header) */}
      <View
        className="bg-[#2563eb] px-5"
        style={{
          paddingTop: isCompact ? 14 : 24,
          paddingBottom: isCompact ? 20 : 28,
        }}
      >
        <View className="flex-row items-center justify-between">
          {/* Brand Identity: 44x44 Box Logo + ParcelHub + Hub Subtitle */}
          <View className="flex-row items-center">
            {/* 44x44 Isometric 3D Box Logo */}
            <View
              className="rounded-[12px] bg-[rgba(255,255,255,0.16)] items-center justify-center border border-[rgba(255,255,255,0.2)] mr-3"
              style={{
                width: 44,
                height: 44,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 16V8C20.9993 7.2862 20.6182 6.6269 20 6.27L13 2.27C12.3812 1.91273 11.6188 1.91273 11 2.27L4 6.27C3.38183 6.6269 3.00073 7.2862 3 8V16C3.00073 16.7138 3.38183 17.3731 4 17.73L11 21.73C11.6188 22.0873 12.3812 22.0873 13 21.73L20 17.73C20.6182 17.3731 20.9993 16.7138 21 16V16"
                  stroke="#ffffff"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M3.27 6.96L12 12.01L20.73 6.96"
                  stroke="#ffffff"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M12 22.08V12"
                  stroke="#ffffff"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>

            {/* Title & Subtitle */}
            <View>
              <Text className="text-[18px] font-bold text-white leading-[22px]">
                ParcelHub
              </Text>
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <View className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                <Text className="text-[11px] font-bold text-[#dbeafe] uppercase tracking-wide">
                  LILY'S CATERING HUB
                </Text>
              </View>
            </View>
          </View>

          {/* Help Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigateTo('faq')}
            className="w-9 h-9 rounded-full bg-white/10 items-center justify-center border border-white/20"
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-4"
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
            {/* Status Pills Row */}
            <View className="flex-row items-center gap-2 mb-3">
              {/* Ready */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigateTo('transactions')}
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-black/5"
              >
                <View className="w-2 h-2 rounded-full bg-[#10b981]" />
                <Text className="text-[11px] font-bold text-[#1e1e1e]">
                  {readyCount} Ready
                </Text>
              </TouchableOpacity>

              {/* In Transit */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigateTo('transactions')}
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-black/5"
              >
                <View className="w-2 h-2 rounded-full bg-[#2563eb]" />
                <Text className="text-[11px] font-bold text-[#1e1e1e]">
                  {inTransitCount} In Transit
                </Text>
              </TouchableOpacity>

              {/* Unpaid */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigateTo('transactions')}
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-black/5"
              >
                <View className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                <Text className="text-[11px] font-bold text-[#1e1e1e]">
                  {unpaidCount} Unpaid
                </Text>
              </TouchableOpacity>
            </View>

            {/* Greeting & Subtitle */}
            <Text className="text-[22px] font-bold text-[#1e1e1e] tracking-tight">
              Welcome {displayName}!
            </Text>
            <Text className="text-[13px] font-normal text-[#94a3b8] mt-1 mb-4">
              Create an order or track existing deliveries
            </Text>

            {/* Create Order Button (h: 48px, bg: #2563EB, rounded-xl) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigateTo('create_order')}
              className="w-full h-12 rounded-xl bg-[#2563eb] items-center justify-center flex-row"
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
                  onPress={() => navigateTo('create_order')}
                  className="mt-3 px-4 py-2 rounded-xl bg-[#2563eb]"
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
                      onPress={() => navigateTo('order_details', { orderId: order.id })}
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
                          {order.product}
                        </Text>
                        <Text className="text-[12px] font-normal text-[#6b7280] leading-[16px] mt-0.5">
                          {order.dateLabel}
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
