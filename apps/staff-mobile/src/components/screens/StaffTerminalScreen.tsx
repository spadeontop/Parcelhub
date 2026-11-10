import React, { useState } from 'react';
import { View, SafeAreaView } from 'react-native';
import { useStaff } from '../../context/StaffContext';
import { StaffHeader } from '../header/StaffHeader';
import { StaffSearchBar } from '../header/StaffSearchBar';
import { StaffFilterTabs } from '../navigation/StaffFilterTabs';
import { StaffOrdersList } from '../cards/StaffOrdersList';
import { StaffBottomNav, BottomNavTab } from '../navigation/StaffBottomNav';
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
    showToast,
  } = useStaff();

  const [bottomTab, setBottomTab] = useState<BottomNavTab>('home');

  // When on "Orders" bottom tab, display all orders (or filtered by search)
  const displayOrders = bottomTab === 'orders'
    ? (searchQuery.trim()
        ? orders.filter((o) => {
            const q = searchQuery.trim().toLowerCase();
            return (
              o.id.toLowerCase().includes(q) ||
              o.trackingId.toLowerCase().includes(q) ||
              o.customer.toLowerCase().includes(q) ||
              (o.productName || '').toLowerCase().includes(q)
            );
          })
        : orders)
    : filteredOrders;

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <View
        className="flex-1 bg-[#F8FAFC] relative"
        // Let the child FlatList own vertical overflow instead of growing this page.
        style={{ minHeight: 0, overflow: 'hidden' }}
      >
        {/* Terminal Header & Search */}
        <StaffHeader>
          <StaffSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenLookup={() => setIsLookupOpen(true)}
            onClear={() => setSearchQuery('')}
          />
        </StaffHeader>

        {/* Tab Filters (Visible in 'home' tab) */}
        {bottomTab === 'home' && (
          <StaffFilterTabs
            activeTab={activeTab}
            badgeCounts={badgeCounts}
            onSelectTab={setActiveTab}
          />
        )}

        {/* Orders Queue List */}
        <StaffOrdersList
          orders={displayOrders}
          allOrders={orders}
          activeTab={activeTab}
          searchQuery={searchQuery}
          isRefreshing={isRefreshing}
          onRefresh={refreshOrders}
          onSelectOrder={openOrderDetails}
          onSelectTab={setActiveTab}
        />

        {/* Bottom Navigation matching home.png */}
        <StaffBottomNav
          currentTab={bottomTab}
          onSelectTab={(tab) => {
            setBottomTab(tab);
          }}
          onOpenScan={() => setIsLookupOpen(true)}
          onOpenAccount={() => setIsDeskInfoOpen(true)}
        />

        {/* Complete Details Full-Screen Modal */}
        <StaffOrderDetailsModal
          order={selectedOrder}
          isOpen={isDetailsOpen}
          onClose={closeOrderDetails}
        />

        {/* Manual Scanner / Lookup Modal */}
        <StaffManualLookupModal
          isOpen={isLookupOpen}
          orders={orders}
          onClose={() => setIsLookupOpen(false)}
          onSelectOrder={openOrderDetails}
          onNotFound={(query) => showToast(`No order found matching "${query}"`, 'error')}
        />

        {/* Account / Desk Info Modal */}
        <StaffDeskInfoModal
          isOpen={isDeskInfoOpen}
          onClose={() => setIsDeskInfoOpen(false)}
        />
      </View>
    </SafeAreaView>
  );
};
