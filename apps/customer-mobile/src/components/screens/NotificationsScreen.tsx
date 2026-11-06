import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../layout/BottomNav';
import Svg, { Path } from 'react-native-svg';

export const NotificationsScreen: React.FC = () => {
  const { notifications, markAllNotificationsAsRead, navigateTo } = useApp();
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }} className="flex-1 bg-white px-5 pt-3 pb-2">
      {/* Screen Header Label */}
      <View className="py-2 border-b border-gray-100/90 pb-3 mb-2">
        <Text className="text-xl font-extrabold tracking-tight text-gray-900 leading-none">
          Notifications
        </Text>
        <Text className="text-[10px] font-bold tracking-wider text-gray-500 uppercase mt-1">
          ACTIVITY UPDATES
        </Text>
      </View>

      {/* Screen Title & Quick Actions */}
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <View className="flex-row items-center">
          <Text className="text-xl font-extrabold text-[#181b20] tracking-tight">
            Inbox
          </Text>
          {unreadCount > 0 ? (
            <View
              style={{ marginLeft: 8 }}
              className="flex-row items-center px-2.5 py-0.5 rounded-full bg-[#eff6ff] border border-[#dbeafe]"
            >
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#1b65e8', marginRight: 5 }} />
              <Text className="text-[11px] font-bold text-[#1b65e8]">
                {unreadCount} unread
              </Text>
            </View>
          ) : (
            <View
              style={{ marginLeft: 8 }}
              className="flex-row items-center px-2.5 py-0.5 rounded-full bg-gray-50 border border-gray-200/70"
            >
              <Text className="text-[11px] font-medium text-gray-500">
                All caught up
              </Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={markAllNotificationsAsRead}
            className="px-3 py-1.5 rounded-xl bg-gray-100/90 active:bg-gray-200"
          >
            <Text className="text-xs font-semibold text-[#1b65e8]">
              Mark all as read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notification List or Empty State */}
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {notifications.length === 0 ? (
          <View className="min-h-[300px] rounded-3xl bg-[#fafbfd] border border-gray-100 items-center justify-center p-6 mt-4">
            <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-3">
              <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                  stroke="#1b65e8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text className="text-[#181b20] font-bold text-base text-center">
              No notifications yet
            </Text>
            <Text className="text-gray-500 text-xs text-center mt-1 max-w-xs leading-relaxed">
              When your parcel status updates or requires pickup action, you’ll see the notifications here.
            </Text>
          </View>
        ) : (
          <View className="pb-4">
            {notifications.map((item) => (
              <View
                key={item.id}
                style={{ marginBottom: 12 }}
                className={`p-4 rounded-2xl border transition-all ${
                  item.unread
                    ? 'bg-[#f8faff] border-[#dbeafe]'
                    : 'bg-[#fafbfd] border-[#f1f5f9]'
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <View className="flex-row items-center">
                      {item.unread && (
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#1b65e8',
                            marginRight: 6,
                          }}
                        />
                      )}
                      <Text
                        className={`text-sm font-bold ${
                          item.unread ? 'text-[#181b20]' : 'text-gray-700'
                        }`}
                      >
                        {item.title}
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {item.body}
                    </Text>
                  </View>
                  <Text className="text-[11px] font-medium text-gray-400">
                    {item.time}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Nav with Notifications active */}
      <BottomNav activeTab="notifications" />
    </View>
  );
};