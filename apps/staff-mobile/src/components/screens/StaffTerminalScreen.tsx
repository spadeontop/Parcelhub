import React from 'react';
import { View, SafeAreaView } from 'react-native';
import { useStaff } from '../../context/StaffContext';
import { StaffHeader } from '../header/StaffHeader';
import { StaffSearchBar } from '../header/StaffSearchBar';
import { StaffFilterTabs } from '../navigation/StaffFilterTabs';
import { StaffOrdersList } from '../cards/StaffOrdersList';
import { StaffBottomNav } from '../navigation/StaffBottomNav';
import { StaffOrderDetailsModal } from '../modals/details/StaffOrderDetailsModal';
import { StaffManualLookupModal } from '../modals/StaffManualLookupModal';
import { StaffDeskInfoModal } from '../modals/StaffDeskInfoModal';

export const StaffTerminalScreen: React.FC = () => {
  const {
    orders,
    filteredOrders,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    badgeCounts,
    selectedOrder,
    isDetailsOpen,
    openOrderDetails,
    closeOrderDetails,
    isLookupOpen,
    setIsLookupOpen,
    isDeskInfoOpen,
    setIsDeskInfoOpen,
    isRefreshing,
    refreshOrders,
    logout,
    showToast,
  } = useStaff();

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 bg-slate-950 relative">
        {/* Terminal Header & Search */}
        <StaffHeader>
          <StaffSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenLookup={() => setIsLookupOpen(true)}
            onClear={() => setSearchQuery('')}
          />
        </StaffHeader>

        {/* Tab Filters with Badge Counts */}
        <StaffFilterTabs
          activeTab={activeTab}
          badgeCounts={badgeCounts}
          onSelectTab={setActiveTab}
        />

        {/* Orders Queue List */}
        <StaffOrdersList
          orders={filteredOrders}
          allOrders={orders}
          activeTab={activeTab}
          searchQuery={searchQuery}
          isRefreshing={isRefreshing}
          onRefresh={refreshOrders}
          onSelectOrder={openOrderDetails}
          onSelectTab={setActiveTab}
        />

        {/* Bottom Navigation */}
        <StaffBottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenDeskInfo={() => setIsDeskInfoOpen(true)}
          onSignOut={logout}
        />

        {/* Modals */}
        <StaffOrderDetailsModal
          order={selectedOrder}
          isOpen={isDetailsOpen}
          onClose={closeOrderDetails}
        />

        <StaffManualLookupModal
          isOpen={isLookupOpen}
          orders={orders}
          onClose={() => setIsLookupOpen(false)}
          onSelectOrder={openOrderDetails}
          onNotFound={(query) => showToast(`No order found matching "${query}"`, 'error')}
        />

        <StaffDeskInfoModal
          isOpen={isDeskInfoOpen}
          onClose={() => setIsDeskInfoOpen(false)}
        />
      </View>
    </SafeAreaView>
  );
};
