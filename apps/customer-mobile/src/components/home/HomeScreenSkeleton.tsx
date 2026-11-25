import React from 'react';
import { View } from 'react-native';
import { ShimmerBox } from '../common/Skeleton';
import { ActiveParcelCardShell } from './ActiveParcelCardShell';
import { HOME_CARD_SHADOW } from './homeStyles';

const PROGRESS_STAGE_PLACEHOLDERS = [0, 1, 2] as const;
const STATUS_BUCKET_PLACEHOLDERS = [0, 1, 2] as const;
const ACTIVITY_ROW_PRESETS = [
  { titleWidth: '74%', pillWidth: 74 },
  { titleWidth: '58%', pillWidth: 86 },
  { titleWidth: '80%', pillWidth: 68 },
  { titleWidth: '64%', pillWidth: 78 },
] as const;

export const ActiveParcelCardSkeleton: React.FC = () => (
  <ActiveParcelCardShell>
    {/* Graphic + Eyebrow + 2-Line Product Title */}
    <View className="flex-row items-center mb-4">
      <ShimmerBox
        tone="onBrand"
        className="w-[76px] h-[76px] rounded-2xl mr-3 shrink-0"
      />

      <View className="flex-1 gap-2">
        <ShimmerBox tone="onBrand" className="w-24 h-3 rounded-full" />
        <ShimmerBox tone="onBrand" className="w-11/12 h-5 rounded-md" />
        <ShimmerBox tone="onBrand" className="w-3/5 h-5 rounded-md" />
      </View>
    </View>

    {/* Labeled 3-Stage Progress Bar */}
    <View className="mb-4">
      <View className="flex-row gap-1.5 mb-2">
        {PROGRESS_STAGE_PLACEHOLDERS.map((stage) => (
          <ShimmerBox
            key={stage}
            tone="onBrand"
            className="flex-1 h-1.5 rounded-full"
          />
        ))}
      </View>
      <View className="flex-row justify-between">
        {PROGRESS_STAGE_PLACEHOLDERS.map((stage) => (
          <ShimmerBox
            key={stage}
            tone="onBrand"
            className="w-14 h-2.5 rounded-full"
          />
        ))}
      </View>
    </View>

    {/* Primary CTA Placeholder */}
    <ShimmerBox
      tone="onBrand"
      className="w-full h-11 rounded-xl"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.28)' }}
    />
  </ActiveParcelCardShell>
);

export const HomeStatusBarSkeleton: React.FC = () => (
  <View
    className="flex-row rounded-[20px] bg-white border border-[#edf2f7] py-3.5 mb-5"
    style={HOME_CARD_SHADOW}
  >
    {STATUS_BUCKET_PLACEHOLDERS.map((bucket, idx) => (
      <View
        key={bucket}
        className="flex-1 items-center justify-center px-2"
        style={
          idx !== 0
            ? { borderLeftWidth: 1, borderLeftColor: '#f1f5f9' }
            : undefined
        }
      >
        <View className="flex-row items-center gap-1.5">
          <ShimmerBox className="w-5 h-5 rounded-full" />
          <ShimmerBox className="w-6 h-5 rounded-md" />
        </View>
        <ShimmerBox className="w-14 h-3 rounded-full mt-1.5" />
      </View>
    ))}
  </View>
);

interface HomeRecentActivitySkeletonProps {
  rowCount?: number;
}

export const HomeRecentActivitySkeleton: React.FC<
  HomeRecentActivitySkeletonProps
> = ({ rowCount = 4 }) => (
  <View>
    {/* Section Header */}
    <View className="flex-row items-center justify-between mb-2.5 px-1">
      <ShimmerBox className="w-28 h-3 rounded-full" />
      <ShimmerBox className="w-16 h-3 rounded-full" />
    </View>

    {/* Recent Activity Feed Card */}
    <View
      className="bg-white rounded-[20px] border border-[#edf2f7] px-4 py-1"
      style={HOME_CARD_SHADOW}
    >
      {Array.from({ length: rowCount }).map((_, idx) => {
        const preset = ACTIVITY_ROW_PRESETS[idx % ACTIVITY_ROW_PRESETS.length];

        return (
          <View
            key={idx}
            className="py-3 flex-row items-center justify-between"
            style={
              idx !== 0
                ? { borderTopWidth: 1, borderTopColor: '#f1f5f9' }
                : undefined
            }
          >
            <View className="flex-1 pr-3">
              <ShimmerBox
                className="h-4 rounded-md"
                style={{ width: preset.titleWidth }}
              />
              <ShimmerBox className="w-24 h-3 rounded-full mt-1.5" />
            </View>

            <View className="flex-row items-center gap-2 shrink-0">
              <ShimmerBox
                className="h-6 rounded-full"
                style={{ width: preset.pillWidth }}
              />
              <ShimmerBox className="w-2 h-3 rounded-full" />
            </View>
          </View>
        );
      })}
    </View>
  </View>
);

export const HomeFabSkeleton: React.FC = () => (
  <View
    pointerEvents="none"
    className="absolute w-14 h-14 rounded-full bg-white border border-[#edf2f7] overflow-hidden"
    style={[
      HOME_CARD_SHADOW,
      {
        right: 20,
        bottom: 88,
        zIndex: 60,
      },
    ]}
  >
    <ShimmerBox className="w-14 h-14 rounded-full" />
  </View>
);

interface HomeScreenSkeletonProps {
  activityRows?: number;
}

export const HomeScreenSkeleton: React.FC<HomeScreenSkeletonProps> = ({
  activityRows = 4,
}) => (
  <View
    accessibilityLabel="Loading home screen"
    accessibilityState={{ busy: true }}
  >
    <ActiveParcelCardSkeleton />
    <HomeStatusBarSkeleton />
    <HomeRecentActivitySkeleton rowCount={activityRows} />
  </View>
);

export default HomeScreenSkeleton;
