import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useApp } from '../../context/AppContext';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  statusDotColor?: string;
  onHelp?: () => void;
  rightElement?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showLogo = false,
  statusDotColor,
  onHelp,
  rightElement,
}) => {
  const { navigateTo } = useApp();
  const { height } = useWindowDimensions();
  const isCompact = height < 700;

  const handleHelp = onHelp || (() => navigateTo('faq'));

  return (
    <View
      className="bg-[#2563eb] px-5"
      style={{
        paddingTop: isCompact ? 14 : 24,
        paddingBottom: isCompact ? 20 : 28,
      }}
    >
      <View className="flex-row items-center justify-between">
        {/* Left Side: Brand identity or Title */}
        <View className="flex-row items-center">
          {showLogo && (
            <View
              className="rounded-[12px] bg-[rgba(255,255,255,0.16)] items-center justify-center border border-[rgba(255,255,255,0.2)] mr-3"
              style={{
                width: 44,
                height: 44,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 16V8C20.9993 7.2862 20.6182 6.6269 20 6.27L13 2.27C12.3812 1.91273 11.6188 1.91273 11 2.27L4 6.27C3.38183 6.6269 3.00073 7.2862 3 8V16C3.00073 16.7138 3.38183 17.3731 4 17.73L11 21.73C11.6188 22.0873 12.3812 22.0873 13 21.73L20 17.73C20.6182 17.3731 20.9993 16.7138 21 16V16"
                  stroke="#ffffff"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M3.27 6.96L12 12.01L20.73 6.96"
                  stroke="#ffffff"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M12 22.08V12"
                  stroke="#ffffff"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          )}

          <View>
            <Text
              className={`font-bold text-white tracking-tight leading-[26px] ${
                showLogo ? 'text-[18px]' : 'text-[20px]'
              }`}
            >
              {title}
            </Text>
            {subtitle && (
              <View className="flex-row items-center gap-1.5 mt-0.5">
                {statusDotColor && (
                  <View
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: statusDotColor }}
                  />
                )}
                <Text className="text-[11px] font-bold text-[#dbeafe] uppercase tracking-wider">
                  {subtitle}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Right Action: custom rightElement or Help Button */}
        {rightElement ? (
          rightElement
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleHelp}
            className="w-9 h-9 rounded-full bg-white/20 items-center justify-center border border-white/20"
            accessibilityLabel="Help"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                stroke="#ffffff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default AppHeader;
