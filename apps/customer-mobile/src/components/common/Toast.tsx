import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';

interface ToastProps {
  message: string;
  isOpen: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, isOpen }) => {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, translateY, opacity]);

  if (!isOpen) return null;

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        opacity,
      }}
      className="absolute bottom-20 left-4 right-4 z-50 items-center pointer-events-none"
    >
      <View className="bg-gray-900/95 px-5 py-3 rounded-2xl border border-gray-700 flex-row items-center shadow-2xl max-w-sm">
        <View className="w-2.5 h-2.5 rounded-full bg-[#10b780] mr-2.5" />
        <Text className="text-white text-xs font-semibold tracking-wide flex-1 text-center">
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

