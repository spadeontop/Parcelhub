import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';

export interface ToastProps {
  message?: string;
  isOpen?: boolean;
  onPress?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, isOpen = false, onPress }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const translateY = useRef(new Animated.Value(24)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 24,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [isOpen, translateY, opacity]);

  if (!shouldRender && !isOpen) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={onPress ? 'box-none' : 'none'}
      style={{
        position: 'absolute',
        bottom: 36,
        left: 20,
        right: 20,
        alignItems: 'center',
        zIndex: 9999,
        elevation: 9999,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <TouchableOpacity
        activeOpacity={onPress ? 0.8 : 1}
        disabled={!onPress}
        onPress={onPress}
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          paddingVertical: 12,
          paddingHorizontal: 18,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(51, 65, 85, 0.6)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: 360,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 6,
        }}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#10B981',
            marginRight: 10,
          }}
        />
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: '600',
            letterSpacing: 0.2,
            textAlign: 'center',
          }}
        >
          {message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Toast;
