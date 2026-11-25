import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { FloatingInput } from '../common/FloatingInput';
import { FieldError } from '../common/FieldError';

const BRAND_BLUE = '#215cd4';

const CARD_SHADOW = {
  shadowColor: '#111827',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 8,
  elevation: 2,
};

export interface CreateOrderFieldErrors {
  product?: string;
  recipient?: string;
  amount?: string;
  trackingId?: string;
}

export interface CreateOrderDetailsCardProps {
  readonly isActive: boolean;
  readonly isScanning: boolean;
  readonly isHighlighted: boolean;
  readonly feedbackMessage: string | null;
  readonly shakeAnim: Animated.Value;
  readonly product: string;
  readonly recipient: string;
  readonly totalAmount: string;
  readonly trackingId: string;
  readonly isTrackingIdLocked: boolean;
  readonly fieldErrors: CreateOrderFieldErrors;
  readonly amountError: string;
  readonly trackingError: string | null;
  readonly onChangeProduct: (text: string) => void;
  readonly onChangeRecipient: (text: string) => void;
  readonly onChangeAmount: (text: string) => void;
  readonly onChangeTrackingId: (text: string) => void;
  readonly onLockedPress: () => void;
}

/**
 * Step 2 card displaying progressive-unlock order detail fields using shared FloatingInput.
 */
export const CreateOrderDetailsCard: React.FC<CreateOrderDetailsCardProps> = ({
  isActive,
  isScanning,
  isHighlighted,
  feedbackMessage,
  shakeAnim,
  product,
  recipient,
  totalAmount,
  trackingId,
  isTrackingIdLocked,
  fieldErrors,
  amountError,
  trackingError,
  onChangeProduct,
  onChangeRecipient,
  onChangeAmount,
  onChangeTrackingId,
  onLockedPress,
}) => {
  return (
    <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
      <View
        className="rounded-[16px] p-3.5 border relative"
        style={[
          CARD_SHADOW,
          {
            backgroundColor: isHighlighted ? '#fff5f5' : '#ffffff',
            borderColor: isHighlighted ? '#fca5a5' : '#f1f5f9',
          },
        ]}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-2.5">
          <Text className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.55px]">
            ORDER DETAILS
          </Text>
          {isScanning ? (
            <Text className="text-[11px] font-medium text-[#215cd4]">
              Auto-filling...
            </Text>
          ) : null}
        </View>

        {/* Form Fields */}
        <View
          style={{ opacity: isActive ? 1 : 0.45 }}
          pointerEvents={isActive ? 'auto' : 'none'}
        >
          <FloatingInput
            label="Product"
            value={product}
            editable={isActive}
            focusedBorderColor={BRAND_BLUE}
            error={fieldErrors.product}
            containerStyle={{ marginBottom: 8 }}
            onChangeText={onChangeProduct}
          />

          <FloatingInput
            label="Receiver's Name"
            value={recipient}
            editable={isActive}
            focusedBorderColor={BRAND_BLUE}
            error={fieldErrors.recipient}
            containerStyle={{ marginBottom: 8 }}
            onChangeText={onChangeRecipient}
          />

          <FloatingInput
            label="Total Amount"
            value={totalAmount}
            editable={isActive}
            focusedBorderColor={BRAND_BLUE}
            error={fieldErrors.amount || amountError}
            keyboardType="numeric"
            containerStyle={{ marginBottom: 8 }}
            onChangeText={onChangeAmount}
          />

          <FloatingInput
            label="Tracking ID"
            value={trackingId}
            editable={isActive && !isTrackingIdLocked}
            focusedBorderColor={BRAND_BLUE}
            error={fieldErrors.trackingId || trackingError || undefined}
            autoCapitalize="characters"
            containerStyle={{ marginBottom: 0 }}
            onChangeText={onChangeTrackingId}
            rightElement={
              isTrackingIdLocked ? (
                <View className="bg-[#eff6ff] px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-[#215cd4]">
                    Verified
                  </Text>
                </View>
              ) : undefined
            }
          />
        </View>

        {feedbackMessage ? (
          <FieldError message={feedbackMessage} color="#dc2626" />
        ) : null}

        {/* Transparent Tap-Capture Overlay when Locked */}
        {!isActive && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={onLockedPress}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
        )}
      </View>
    </Animated.View>
  );
};

export default CreateOrderDetailsCard;
