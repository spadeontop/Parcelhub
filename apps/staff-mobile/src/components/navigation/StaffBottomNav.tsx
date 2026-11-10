import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { LayoutGrid, Package, QrCode, Settings } from '../common/Icons';

export type BottomNavTab = 'home' | 'orders' | 'scan' | 'account';

// Keep this in sync with the list inset so the last item is never obscured.
export const STAFF_BOTTOM_NAV_HEIGHT = 82;

interface StaffBottomNavProps {
  currentTab: BottomNavTab;
  onSelectTab: (tab: BottomNavTab) => void;
  onOpenScan: () => void;
  onOpenAccount: () => void;
}

export const StaffBottomNav: React.FC<StaffBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenScan,
  onOpenAccount,
}) => {
  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-[#F8FAFC]/95 border-t border-[#E2E8F0] px-4 pt-2 pb-5 flex-row items-center justify-around"
      style={{
        // React Native Web supports fixed positioning; native apps retain the
        // equivalent absolute positioning inside the full-screen root view.
        ...(Platform.OS === 'web'
          ? { position: 'fixed' as unknown as 'absolute', bottom: 0, left: 0, right: 0 }
          : { position: 'absolute', bottom: 0, left: 0, right: 0 }),
        minHeight: STAFF_BOTTOM_NAV_HEIGHT,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      {/* Home Tab */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelectTab('home')}
        className="items-center justify-center py-1 flex-1"
      >
        <LayoutGrid
          size={20}
          color={currentTab === 'home' ? '#215CD4' : '#64748B'}
        />
        <Text
          className={`text-[10px] font-semibold mt-1 ${
            currentTab === 'home' ? 'text-[#215CD4] font-bold' : 'text-[#64748B]'
          }`}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* Orders Tab */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelectTab('orders')}
        className="items-center justify-center py-1 flex-1"
      >
        <Package
          size={20}
          color={currentTab === 'orders' ? '#215CD4' : '#64748B'}
        />
        <Text
          className={`text-[10px] font-semibold mt-1 ${
            currentTab === 'orders' ? 'text-[#215CD4] font-bold' : 'text-[#64748B]'
          }`}
        >
          Orders
        </Text>
      </TouchableOpacity>

      {/* Center Scan Action Button matching home.png */}
      <View className="items-center justify-center flex-1 -mt-4">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onOpenScan}
          className="w-13 h-13 rounded-full bg-[#215CD4] items-center justify-center shadow-lg active:bg-[#1d4ed8]"
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            shadowColor: '#215CD4',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 8,
          }}
          accessibilityLabel="Scan QR / Lookup Order"
        >
          <QrCode size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-[10px] font-semibold text-[#215CD4] mt-1">
          Scan
        </Text>
      </View>

      {/* Account Tab */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onOpenAccount}
        className="items-center justify-center py-1 flex-1"
      >
        <Settings
          size={20}
          color={currentTab === 'account' ? '#215CD4' : '#64748B'}
        />
        <Text
          className={`text-[10px] font-semibold mt-1 ${
            currentTab === 'account' ? 'text-[#215CD4] font-bold' : 'text-[#64748B]'
          }`}
        >
          Account
        </Text>
      </TouchableOpacity>
    </View>
  );
};
