import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { CheckCircle, AlertCircle, Info } from './Icons';

interface ToastProps {
  message?: string;
  isOpen?: boolean;
  type?: 'info' | 'success' | 'error';
}

const TOAST_THEMES = {
  success: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    iconBg: '#D1FAE5',
    textColor: '#065F46',
    icon: <CheckCircle size={15} color="#059669" strokeWidth={2.5} />,
  },
  error: {
    bg: '#FFF1F2',
    border: '#FECDD3',
    iconBg: '#FFE4E6',
    textColor: '#9F1239',
    icon: <AlertCircle size={15} color="#DC2626" strokeWidth={2.5} />,
  },
  info: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    iconBg: '#DBEAFE',
    textColor: '#1E40AF',
    icon: <Info size={15} color="#215CD4" strokeWidth={2.5} />,
  },
};

export const Toast: React.FC<ToastProps> = ({ message, isOpen, type = 'info' }) => {
  const [visible, setVisible] = useState<boolean>(Boolean(isOpen && message));
  const [currentMessage, setCurrentMessage] = useState<string>(message || '');
  const [currentType, setCurrentType] = useState<'info' | 'success' | 'error'>(type);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    if (isOpen && message) {
      setCurrentMessage(message);
      setCurrentType(type);
      setVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -16,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setVisible(false);
        }
      });
    }
  }, [isOpen, message, type]);

  if (!visible) return null;

  const config = TOAST_THEMES[currentType] || TOAST_THEMES.info;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        zIndex: 9999,
        alignItems: 'center',
      }}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 6,
          backgroundColor: config.bg,
          borderColor: config.border,
          borderWidth: 1,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          maxWidth: '92%',
          gap: 10,
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: config.iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {config.icon}
        </View>
        <Text
          style={{
            color: config.textColor,
            fontSize: 13,
            fontWeight: '600',
            lineHeight: 18,
            flexShrink: 1,
          }}
        >
          {currentMessage}
        </Text>
      </Animated.View>
    </View>
  );
};
