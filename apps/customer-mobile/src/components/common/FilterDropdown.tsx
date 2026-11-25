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

export function FilterDropdown<T extends string>({ value, options, countLabel, onChange, accessibilityLabel = 'Filter options' }: FilterDropdownProps<T>) {
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

  useEffect(() => {
    dropdownOffset.value = withTiming(filterOpen ? 1 : 0, {
      duration: filterOpen ? 220 : 180,
      easing: filterOpen ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
  }, [dropdownOffset, filterOpen]);


  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;

  return (
    <View className="mx-5 z-10">
        <TouchableOpacity
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ expanded: filterOpen }}
          onPress={() => setFilterOpen((open) => !open)}
          className="mb-3 h-[50px] border border-[#e5eaf3] rounded-2xl flex-row items-center justify-between px-4 bg-white"
        >
          <Text className="text-[14px] font-semibold text-[#111827]">{selectedLabel}</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-[12px] font-medium text-[#2563eb]">{countLabel}</Text>
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <Path d="M5 7.5L10 12.5L15 7.5" stroke="#64748b" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
        </TouchableOpacity>

        <View
          pointerEvents="box-none"
          className="absolute top-[56px] left-0 right-0 z-10"
          collapsable={false}
        >
          <Animated.View
            pointerEvents={filterOpen ? 'auto' : 'none'}
            accessibilityElementsHidden={!filterOpen}
            importantForAccessibility={filterOpen ? 'auto' : 'no-hide-descendants'}
            style={[{
              backgroundColor: '#fff',
              borderRadius: 16,
              borderColor: '#e5eaf3',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }, dropdownStyle]}
          >
            <Animated.View style={{ flex: 1, overflow: 'hidden', borderRadius: 16, borderColor: '#e5eaf3' }}>
            <Animated.View
              onLayout={(event) => { dropdownHeight.value = event.nativeEvent.layout.height; }}
              style={[{ position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#fff' }, dropdownContentStyle]}
            >
            {options.map((option) => {
              const selected = value === option.value;
              const count = option.count;
              const dotColor = option.color;
              return (
                <TouchableOpacity
                  key={option.value}
                  disabled={!filterOpen}
                  activeOpacity={1}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    onChange(option.value);
                    setFilterOpen(false);
                  }}
                  className={`flex-row items-center justify-between px-4 py-3 ${selected ? 'bg-[#eff6ff]' : 'bg-white'}`}
                >
                  <View className="flex-row items-center gap-2.5">
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
                    <Text className={`text-[13px] text-[#111827] ${selected ? 'font-semibold' : 'font-medium'}`}>{option.label}</Text>
                  </View>
                  {typeof count === 'number' && (
                    <Text className="text-[12px] text-[#4b5563]">{count}</Text>
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
