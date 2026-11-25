import React from 'react';
import { StyleProp, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { CARD_SHADOW } from '../common/cardStyles';
import { CopyIcon } from '../common/Icons';

interface OrderSectionCardProps {
  readonly title: string;
  readonly headerRight?: React.ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly children: React.ReactNode;
}

/**
 * Standard minimalist white surface card used across all order detail views.
 */
export const OrderSectionCard: React.FC<OrderSectionCardProps> = ({
  title,
  headerRight,
  style,
  children,
}) => (
  <View
    className="bg-white border border-[#edf2f7] rounded-[20px] p-5 mb-3.5"
    style={[CARD_SHADOW, style]}
  >
    <View className="flex-row items-center justify-between">
      <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.65px]">
        {title}
      </Text>
      {headerRight}
    </View>
    {children}
  </View>
);

interface OrderProductBlockProps {
  readonly productName: string;
  readonly withDivider?: boolean;
}

/**
 * Un-cramped 2-line product title block anchored at the top of an order card.
 */
export const OrderProductBlock: React.FC<OrderProductBlockProps> = ({
  productName,
  withDivider = true,
}) => (
  <View
    className={withDivider ? 'mt-2.5 pb-4 border-b border-[#f1f5f9]' : 'mt-2.5'}
  >
    <Text
      className="text-[15.5px] font-bold text-[#0f172a] leading-[22px] tracking-[-0.25px]"
      numberOfLines={2}
    >
      {productName}
    </Text>
  </View>
);

interface OrderDetailRowProps {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly alignTop?: boolean;
  readonly valueNumberOfLines?: number;
}

/**
 * Horizontal metadata row with muted label on the left and right-aligned value.
 */
export const OrderDetailRow: React.FC<OrderDetailRowProps> = ({
  label,
  value,
  alignTop = false,
  valueNumberOfLines = 1,
}) => (
  <View
    className={
      alignTop
        ? 'flex-row items-start justify-between'
        : 'flex-row items-center justify-between'
    }
  >
    <Text className="text-[13.5px] text-[#64748b] font-medium">{label}</Text>
    {typeof value === 'string' ? (
      <Text
        className="text-[13.5px] font-semibold text-[#0f172a] flex-1 text-right ml-4 leading-[19px]"
        numberOfLines={valueNumberOfLines}
      >
        {value}
      </Text>
    ) : (
      value
    )}
  </View>
);

interface OrderCodeBadgeProps {
  readonly code: string;
  readonly onCopy?: () => void;
}

/**
 * Monospace tracking or ticket code pill with optional tap-to-copy affordance.
 */
export const OrderCodeBadge: React.FC<OrderCodeBadgeProps> = ({ code, onCopy }) => {
  if (onCopy) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onCopy}
        className="bg-[#f8fafc] border border-[#e2e8f0] flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-[8px]"
      >
        <Text className="font-mono font-bold text-[12px] text-[#1e293b]">
          {code}
        </Text>
        <CopyIcon size={13} color="#64748b" />
      </TouchableOpacity>
    );
  }

  return (
    <View className="bg-[#f8fafc] border border-[#e2e8f0] px-2.5 py-1 rounded-[8px]">
      <Text className="font-mono font-bold text-[12px] text-[#1e293b]">
        {code}
      </Text>
    </View>
  );
};

interface OrderAmountRowProps {
  readonly label: string;
  readonly value: string;
  readonly emphasized?: boolean;
  readonly tone?: 'default' | 'muted' | 'brand';
  readonly withTopDivider?: boolean;
}

/**
 * Financial summary line item supporting standard ledger rows and emphasized totals.
 */
export const OrderAmountRow: React.FC<OrderAmountRowProps> = ({
  label,
  value,
  emphasized = false,
  tone = 'default',
  withTopDivider = false,
}) => {
  const valueColor =
    tone === 'brand' ? '#215cd4' : tone === 'muted' ? '#64748b' : '#0f172a';

  return (
    <View
      className={
        withTopDivider
          ? 'border-t border-[#f1f5f9] pt-3 flex-row items-baseline justify-between'
          : 'flex-row items-baseline justify-between'
      }
    >
      <Text
        className={
          emphasized
            ? 'text-[14px] font-semibold text-[#0f172a]'
            : 'text-[13.5px] font-medium text-[#64748b]'
        }
      >
        {label}
      </Text>
      <Text
        className={
          emphasized
            ? 'text-[17px] font-bold tracking-[-0.3px]'
            : 'text-[14px] font-semibold'
        }
        style={{ color: valueColor }}
      >
        {value}
      </Text>
    </View>
  );
};

interface ReturnHomeLinkProps {
  readonly onPress: () => void;
  readonly disabled?: boolean;
}

/**
 * Unified understated secondary Return to Home action across all order detail & pass views.
 */
export const ReturnHomeLink: React.FC<ReturnHomeLinkProps> = ({
  onPress,
  disabled = false,
}) => (
  <TouchableOpacity
    activeOpacity={0.7}
    disabled={disabled}
    onPress={onPress}
    className="items-center justify-center py-2"
  >
    <Text className="text-[12.5px] font-semibold text-[#475569] text-center">
      Return to Home
    </Text>
  </TouchableOpacity>
);
