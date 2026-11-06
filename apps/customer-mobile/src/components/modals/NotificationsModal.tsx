import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useApp } from '../../context/AppContext';
import { CloseIcon } from '../common/Icons';

export const NotificationsModal: React.FC = () => {
  const {
    isNotificationsModalOpen,
    closeNotificationsModal,
    notifications,
    markAllNotificationsAsRead,
  } = useApp();

  if (!isNotificationsModalOpen) return null;

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={isNotificationsModalOpen}
      onRequestClose={closeNotificationsModal}
    >
      <View className="flex-1 bg-black/60 justify-center items-center px-4">
        <View className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl max-h-[80%]">
          <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
            <View className="flex-row items-center">
              <Text className="text-base font-bold text-gray-900">
                Notifications
              </Text>
              {unreadCount > 0 && (
                <View
                  style={{ marginLeft: 8 }}
                  className="flex-row items-center px-2 py-0.5 rounded-full bg-[#eff6ff] border border-[#dbeafe]"
                >
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#1b65e8', marginRight: 4 }} />
                  <Text className="text-[10px] font-bold text-[#1b65e8]">
                    {unreadCount} New
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={closeNotificationsModal}
              className="p-1 rounded-full bg-gray-100"
            >
              <CloseIcon size={18} color="#4b5563" />
            </TouchableOpacity>
          </View>

          <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
            {notifications.map((item) => (
              <View
                key={item.id}
                className={`p-3 rounded-2xl border mb-2 ${
                  item.unread
                    ? 'bg-blue-50/70 border-blue-100'
                    : 'bg-[#f8f8f8] border-gray-100'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-bold text-gray-900">{item.title}</Text>
                  <Text className="text-[10px] text-gray-400">{item.time}</Text>
                </View>
                <Text className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {item.body}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View className="flex-row gap-2 mt-4">
            <TouchableOpacity
              onPress={markAllNotificationsAsRead}
              className="flex-1 py-3 bg-gray-100 rounded-2xl items-center"
            >
              <Text className="text-gray-700 font-bold text-xs">Mark All Read</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={closeNotificationsModal}
              className="flex-1 py-3 bg-[#215cd4] rounded-2xl items-center"
            >
              <Text className="text-white font-bold text-xs">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

