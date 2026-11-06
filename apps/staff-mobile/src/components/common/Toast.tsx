import React from 'react';
import { View, Text } from 'react-native';

interface ToastProps {
  message?: string;
  isOpen?: boolean;
  type?: 'info' | 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, isOpen, type = 'info' }) => {
  if (!isOpen || !message) return null;

  let bgClass = 'bg-slate-900 border-slate-700 text-white';
  if (type === 'error') {
    bgClass = 'bg-rose-950 border-rose-800 text-rose-200';
  } else if (type === 'success') {
    bgClass = 'bg-emerald-950 border-emerald-800 text-emerald-200';
  }

  return (
    <View className="absolute top-12 left-4 right-4 z-50 items-center pointer-events-none">
      <View className={`px-4 py-2.5 rounded-2xl border shadow-xl flex-row items-center gap-2 max-w-[90%] ${bgClass}`}>
        <Text className="text-xs font-medium text-center">{message}</Text>
      </View>
    </View>
  );
};
