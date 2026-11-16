import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../layout/BottomNav';

export const NotificationsScreen: React.FC = () => {
  const { notifications, markAllNotificationsAsRead, navigateTo } = useApp();
  const unreadCount = notifications.filter((n) => n.unread).length;
  const { height } = useWindowDimensions();
  const isCompact = height < 700;

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
              Notifications
            </Text>
            <Text className="text-[11px] font-bold text-[#dbeafe] uppercase tracking-wider mt-1">
              ACTIVITY UPDATES
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
      <View className="flex-1 bg-[#f8fafc] rounded-t-[32px] pt-4 overflow-hidden">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* Notifications Card Wrapper */}
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
                INBOX
              </Text>

              <View className="flex-row items-center gap-2">
                {unreadCount > 0 ? (
                  <>
                    <View className="flex-row items-center px-2.5 py-1 rounded-full bg-[#eff6ff] border border-[#dbeafe]">
                      <View className="w-1.5 h-1.5 rounded-full bg-[#2563eb] mr-1.5" />
                      <Text className="text-[11px] font-bold text-[#2563eb]">
                        {unreadCount} unread
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={markAllNotificationsAsRead}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 active:bg-slate-200"
                    >
                      <Text className="text-[11px] font-semibold text-[#2563eb]">
                        Mark all as read
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View className="flex-row items-center px-2.5 py-1 rounded-full bg-[#eff6ff] border border-[#dbeafe]">
                    <View className="w-1.5 h-1.5 rounded-full bg-[#2563eb] mr-1.5" />
                    <Text className="text-[11px] font-bold text-[#2563eb]">
                      All caught up
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Empty State vs List */}
            {notifications.length === 0 ? (
              <View className="py-12 px-6 items-center justify-center">
                {/* Bell Icon in Double Circles */}
                <View className="w-[76px] h-[76px] rounded-full bg-[#eff6ff] items-center justify-center mb-4">
                  <View className="w-[54px] h-[54px] rounded-full bg-[#dbeafe]/60 items-center justify-center">
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                        stroke="#2563eb"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M13.73 21a2 2 0 0 1-3.46 0"
                        stroke="#2563eb"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                </View>

                <Text className="text-[17px] font-bold text-[#1e293b] text-center">
                  No notifications yet
                </Text>
                <Text className="text-[12px] font-normal text-[#64748b] text-center mt-2 max-w-[260px] leading-[18px]">
                  When your parcel status updates or requires pickup action, you'll see the notifications here.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigateTo('transactions')}
                  className="mt-6 px-6 py-2.5 rounded-xl border border-[#cbd5e1] bg-white active:bg-slate-50 items-center justify-center"
                >
                  <Text className="text-[12px] font-bold text-[#334155]">
                    View Active Orders
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              notifications.map((item, idx) => {
                const isLast = idx === notifications.length - 1;
                return (
                  <View
                    key={item.id}
                    className={`px-5 py-4 ${!isLast ? 'border-b border-[#f1f5f9]' : ''} ${
                      item.unread ? 'bg-[#f8faff]' : 'bg-white'
                    }`}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-3">
                        <View className="flex-row items-center">
                          {item.unread && (
                            <View className="w-2 h-2 rounded-full bg-[#2563eb] mr-2" />
                          )}
                          <Text
                            className={`text-[13px] font-bold ${
                              item.unread ? 'text-[#1e293b]' : 'text-slate-700'
                            }`}
                          >
                            {item.title}
                          </Text>
                        </View>
                        <Text className="text-[12px] text-[#64748b] mt-1 leading-[18px]">
                          {item.body}
                        </Text>
                      </View>
                      <Text className="text-[11px] font-medium text-[#94a3b8] shrink-0 mt-0.5">
                        {item.time}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Floating Bottom Nav inside the Main Sheet */}
        <BottomNav activeTab="notifications" />
      </View>
    </View>
  );
};

export default NotificationsScreen;
