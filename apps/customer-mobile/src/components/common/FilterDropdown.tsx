import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  color: string;
}

interface FilterDropdownProps<T extends string> {
  value: T;
  options: FilterOption<T>[];
  countLabel: string;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

export function FilterDropdown<T extends string>({
  value,
  options,
  countLabel,
  onChange,
  accessibilityLabel = 'Filter options',
}: FilterDropdownProps<T>) {
  const [filterOpen, setFilterOpen] = useState(false);
  const dropdownOffset = useSharedValue(0);
  const dropdownHeight = useSharedValue(0);

  const dropdownStyle = useAnimatedStyle(() => ({
    height: dropdownHeight.value * dropdownOffset.value,
    borderWidth: dropdownOffset.value > 0 ? 1 : 0,
  }));

  const dropdownContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -dropdownHeight.value * (1 - dropdownOffset.value) }],
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${dropdownOffset.value * 180}deg` }],
  }));

  useEffect(() => {
    dropdownOffset.value = withTiming(filterOpen ? 1 : 0, {
      duration: filterOpen ? 220 : 180,
      easing: filterOpen ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
  }, [dropdownOffset, filterOpen]);

  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label ?? value;
  const selectedColor = selectedOption?.color;
  const showActiveDot = value !== 'ALL' && Boolean(selectedColor);
  const dropdownOptions = options.filter((option) => option.value !== value);
  const canOpen = dropdownOptions.length > 0;

  useEffect(() => {
    if (!canOpen && filterOpen) {
      setFilterOpen(false);
    }
  }, [canOpen, filterOpen]);

  return (
    <View className="mx-5 mb-4" style={{ zIndex: 20 }}>
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={!canOpen}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: filterOpen, disabled: !canOpen }}
        onPress={() => {
          if (canOpen) {
            setFilterOpen((open) => !open);
          }
        }}
        className="h-[46px] border border-[#e5eaf3] rounded-[14px] flex-row items-center justify-between px-4 bg-white"
      >
        <View className="flex-row items-center gap-2 flex-1 pr-2">
          {showActiveDot && (
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: selectedColor,
              }}
            />
          )}
          <Text
            className="text-[14px] font-semibold text-[#0f172a]"
            numberOfLines={1}
          >
            {selectedLabel}
          </Text>
        </View>

        <View className="flex-row items-center gap-2 shrink-0">
          <Text className="text-[12px] font-medium text-[#64748b]">
            {countLabel}
          </Text>
          {canOpen && (
            <Animated.View style={chevronStyle}>
              <Svg width={17} height={17} viewBox="0 0 20 20" fill="none">
                <Path
                  d="M5 7.5L10 12.5L15 7.5"
                  stroke="#94a3b8"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>

      <View
        pointerEvents="box-none"
        className="absolute top-[52px] left-0 right-0"
        style={{ zIndex: 30 }}
        collapsable={false}
      >
        <Animated.View
          pointerEvents={filterOpen ? 'auto' : 'none'}
          accessibilityElementsHidden={!filterOpen}
          importantForAccessibility={filterOpen ? 'auto' : 'no-hide-descendants'}
          style={[
            {
              backgroundColor: '#ffffff',
              borderRadius: 16,
              borderColor: '#e5eaf3',
              shadowColor: '#0f172a',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 5,
            },
            dropdownStyle,
          ]}
        >
          <Animated.View
            style={{
              flex: 1,
              overflow: 'hidden',
              borderRadius: 16,
            }}
          >
            <Animated.View
              onLayout={(event) => {
                dropdownHeight.value = event.nativeEvent.layout.height;
              }}
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: '#ffffff',
                },
                dropdownContentStyle,
              ]}
            >
              {dropdownOptions.map((option, idx) => {
                const count = option.count;
                const dotColor = option.color;
                return (
                  <TouchableOpacity
                    key={option.value}
                    disabled={!filterOpen}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    onPress={() => {
                      onChange(option.value);
                      setFilterOpen(false);
                    }}
                    className="flex-row items-center justify-between px-4 py-3 bg-white"
                    style={
                      idx !== 0
                        ? { borderTopWidth: 1, borderTopColor: '#f1f5f9' }
                        : undefined
                    }
                  >
                    <View className="flex-row items-center gap-2.5">
                      <View
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 3.5,
                          backgroundColor: dotColor,
                        }}
                      />
                      <Text className="text-[13.5px] text-[#0f172a] font-medium">
                        {option.label}
                      </Text>
                    </View>
                    {typeof count === 'number' && (
                      <Text className="text-[12px] font-medium text-[#64748b]">
                        {count}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}
