import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useStaff } from '../../context/StaffContext';
import { StaffHeader } from '../header/StaffHeader';
import { StaffSearchBar } from '../header/StaffSearchBar';
import { StaffFilterTabs } from '../navigation/StaffFilterTabs';
import { StaffOrderCard } from '../cards/StaffOrderCard';
import { StaffAccountModal } from '../modals/StaffAccountModal';
import { StaffOrderDetailsModal } from '../modals/details/StaffOrderDetailsModal';
import { StaffManualLookupModal } from '../modals/StaffManualLookupModal';
import { Inbox } from '../common/Icons';

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

  // Pagination state (5 items per page matching Figma screen 1332:841)
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Reset to page 1 whenever active tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  const pagedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const startRecord = totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endRecord = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  return (
    <View className="flex-1 bg-black">
      {/* Top Header matching Figma 1332:841 */}
      <StaffHeader onOpenAccount={() => setIsDeskInfoOpen(true)} />

      {/* Main Sheet with curved top corners */}
      <View
        style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
        className="flex-1 bg-[#F8FAFC] overflow-hidden"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshOrders}
              tintColor="#2563EB"
              colors={['#2563EB']}
            />
          }
        >
          {/* Search Field & Standalone QR Wing Button */}
          <StaffSearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            onOpenLookup={() => setIsLookupOpen(true)}
          />

          {/* Transactions Filter Pills */}
          <StaffFilterTabs
            activeTab={activeTab}
            badgeCounts={badgeCounts}
            onSelectTab={setActiveTab}
          />

          {/* RECENT ACTIVITIES Section */}
          <View className="px-5 pt-3 pb-2">
            <Text className="text-[11px] font-semibold text-[#6B7280] tracking-[0.55px] uppercase">
              RECENT ACTIVITIES
            </Text>
          </View>

          {/* Elevated Activities List Card Wrapper */}
          <View className="bg-white border border-[#F3F4F6] rounded-[20px] mx-5 p-4 shadow-sm">
            {pagedOrders.length > 0 ? (
              pagedOrders.map((order, idx) => (
                <StaffOrderCard
                  key={order.id}
                  order={order}
                  onPress={openOrderDetails}
                  showDivider={idx < pagedOrders.length - 1}
                />
              ))
            ) : (
              <View className="items-center justify-center py-12">
                <View className="w-12 h-12 rounded-2xl bg-[#F1F5F9] items-center justify-center mb-2.5">
                  <Inbox size={22} color="#94A3B8" />
                </View>
                <Text className="text-sm font-bold text-[#0F172A]">
                  No activities found
                </Text>
                <Text className="text-xs text-[#64748B] text-center mt-1">
                  {searchQuery.trim()
                    ? `No orders matching "${searchQuery}"`
                    : `No orders in ${activeTab === 'all' ? 'terminal' : activeTab} queue`}
                </Text>
              </View>
            )}
          </View>

          {/* Pagination Controls matching Figma 1332:841 */}
          <View className="mt-4 items-center">
            {/* Record range indicator */}
            <Text className="text-[12px] font-medium text-[#475569] mb-3">
              {totalItems > 0
                ? `${startRecord}-${endRecord} out of ${totalItems}`
                : '0 out of 0'}
            </Text>

            {/* Pagination Buttons */}
            <View className="flex-row items-center justify-center gap-2">
              {/* Prev Button */}
              <TouchableOpacity
                onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                activeOpacity={0.7}
                className={`h-[40px] px-4 rounded-[12px] items-center justify-center ${
                  currentPage <= 1
                    ? 'bg-[#F1F5F9]'
                    : 'bg-white border border-[#E2E8F0]'
                }`}
              >
                <Text
                  className={`text-[12px] font-medium ${
                    currentPage <= 1 ? 'text-[#94A3B8]' : 'text-[#475569]'
                  }`}
                >
                  Prev
                </Text>
              </TouchableOpacity>

              {/* Dynamic Page Number Pills */}
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map(
                (pageNum) => {
                  const isActive = currentPage === pageNum;
                  return (
                    <TouchableOpacity
                      key={pageNum}
                      onPress={() => setCurrentPage(pageNum)}
                      activeOpacity={0.8}
                      className={`size-[40px] rounded-[12px] items-center justify-center ${
                        isActive
                          ? 'bg-[#2563EB]'
                          : 'bg-white border border-[#E2E8F0]'
                      }`}
                    >
                      <Text
                        className={`text-[12px] font-medium ${
                          isActive ? 'text-white' : 'text-[#475569]'
                        }`}
                      >
                        {pageNum}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}

              {/* Next Button */}
              <TouchableOpacity
                onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                activeOpacity={0.7}
                className={`h-[40px] px-4 rounded-[12px] items-center justify-center ${
                  currentPage >= totalPages
                    ? 'bg-[#F1F5F9]'
                    : 'bg-white border border-[#E2E8F0]'
                }`}
              >
                <Text
                  className={`text-[12px] font-medium ${
                    currentPage >= totalPages ? 'text-[#94A3B8]' : 'text-[#475569]'
                  }`}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Staff Account Modal (Figma 1336:3) */}
      <StaffAccountModal
        isOpen={isDeskInfoOpen}
        onClose={() => setIsDeskInfoOpen(false)}
      />

      {/* Order Details Modal */}
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
        onNotFound={(query) =>
          showToast(`No order found matching "${query}"`, 'error')
        }
      />
    </View>
  );
};
