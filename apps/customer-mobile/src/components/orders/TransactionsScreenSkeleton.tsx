import React from 'react';
import { View } from 'react-native';
import { CARD_SHADOW } from '../common/cardStyles';
import { ShimmerBox, SkeletonGroup } from '../common/Skeleton';

const SKELETON_PILL_WIDTHS = [68, 96, 84, 80] as const;

const SKELETON_GROUPS = [
  { headerWidth: 54, rows: ['72%', '56%', '66%'] },
  { headerWidth: 96, rows: ['64%', '78%'] },
] as const;

export const TransactionsScreenSkeleton: React.FC = () => (
  <SkeletonGroup enabled>
    <View
      accessibilityLabel="Loading orders"
      accessibilityState={{ busy: true }}
    >
      {/* Horizontal Filter Pill Placeholders */}
      <View className="flex-row items-center gap-2 px-5 mb-3.5">
        {SKELETON_PILL_WIDTHS.map((width, idx) => (
          <ShimmerBox
            key={idx}
            className="h-9 rounded-full"
            style={{ width }}
          />
        ))}
      </View>

      {/* Date-Grouped Order Card Placeholders */}
      <View className="px-5">
        {SKELETON_GROUPS.map((group, gIdx) => (
          <View key={gIdx} className="mb-5">
            <ShimmerBox
              className="h-3 rounded-full mb-2.5 ml-1"
              style={{ width: group.headerWidth }}
            />
            <View
              className="bg-white rounded-[20px] border border-[#edf2f7] px-4 py-1"
              style={CARD_SHADOW}
            >
              {group.rows.map((titleWidth, rIdx) => (
                <View
                  key={rIdx}
                  className="py-3.5 flex-row items-center justify-between"
                  style={
                    rIdx !== 0
                      ? { borderTopWidth: 1, borderTopColor: '#f1f5f9' }
                      : undefined
                  }
                >
                  <View className="flex-1 pr-3">
                    <ShimmerBox
                      className="h-4 rounded-md"
                      style={{ width: titleWidth }}
                    />
                    <View className="flex-row items-center gap-2.5 mt-2">
                      <ShimmerBox className="w-16 h-5 rounded-full" />
                      <ShimmerBox className="w-14 h-3 rounded-full" />
                    </View>
                  </View>
                  <ShimmerBox className="w-12 h-4 rounded-md shrink-0" />
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  </SkeletonGroup>
);

export default TransactionsScreenSkeleton;
