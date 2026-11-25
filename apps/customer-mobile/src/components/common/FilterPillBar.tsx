import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export interface FilterPillOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly count?: number;
}

interface FilterPillBarProps<T extends string> {
  readonly value: T;
  readonly options: readonly FilterPillOption<T>[];
  readonly onChange: (value: T) => void;
  readonly accessibilityLabel?: string;
}

/**
 * Horizontally scrollable minimalist pill selector for switching active filters in one tap.
 */
export function FilterPillBar<T extends string>({
  value,
  options,
  onChange,
  accessibilityLabel = 'Filter options',
}: FilterPillBarProps<T>) {
  if (options.length === 0) {
    return null;
  }

  return (
    <View className="mb-3.5" accessibilityLabel={accessibilityLabel}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          gap: 8,
        }}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onChange(option.value)}
              className="h-9 px-3.5 rounded-full flex-row items-center gap-1.5"
              style={{
                backgroundColor: isSelected ? '#2563eb' : '#ffffff',
                borderWidth: 1,
                borderColor: isSelected ? '#2563eb' : '#e2e8f0',
              }}
            >
              <Text
                className="text-[13px] font-semibold"
                style={{
                  color: isSelected ? '#ffffff' : '#334155',
                }}
              >
                {option.label}
              </Text>
              {typeof option.count === 'number' && (
                <Text
                  className="text-[11.5px] font-semibold"
                  style={{
                    color: isSelected
                      ? 'rgba(255, 255, 255, 0.78)'
                      : '#94a3b8',
                  }}
                >
                  {option.count}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
