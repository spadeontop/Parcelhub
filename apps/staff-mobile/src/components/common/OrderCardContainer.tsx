import React from 'react';
import { View, ViewProps, StyleSheet, Platform } from 'react-native';

export interface OrderCardContainerProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable Card Container matching Figma node 1346:2252
 * Clean white background with rounded-[16px], zero border,
 * and ultra-soft shadow: 0px 3px 12px 0px rgba(15, 23, 42, 0.04).
 */
export const OrderCardContainer: React.FC<OrderCardContainerProps> = ({
  children,
  className = '',
  style,
  ...props
}) => {
  return (
    <View
      className={`bg-white rounded-[16px] p-5 ${className}`}
      style={[styles.card, style]}
      {...props}
    >
      {children}
    </View>
  );
};

// Also export as StaffCardContainer alias for general usage
export const StaffCardContainer = OrderCardContainer;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 0,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0px 3px 12px 0px rgba(15, 23, 42, 0.04)',
      },
    }),
  },
});
