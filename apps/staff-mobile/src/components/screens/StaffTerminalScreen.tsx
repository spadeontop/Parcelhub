import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { useStaffOrders } from '../../hooks/useStaffOrders';
import { staffApi } from '../../services/staffApi';
import { StaffHeader } from '../header/StaffHeader';
import { StaffSearchBar } from '../header/StaffSearchBar';
import { StaffFilterTabs } from '../navigation/StaffFilterTabs';
import { StaffOrderCard } from '../cards/StaffOrderCard';
import { StaffLiveUpdatedRow } from '../cards/StaffLiveUpdatedRow';
import { StaffOrderCardSkeleton } from '../cards/StaffOrderCardSkeleton';
import { StaffAccountModal } from '../modals/StaffAccountModal';
import { StaffOrderDetailsModal } from '../modals/details/StaffOrderDetailsModal';
import { StaffScanQrModal } from '../modals/StaffScanQrModal';
import { Inbox } from '../common/Icons';
import { StaffTab, StaffOrder, JustUpdatedOrderInfo } from '../../types';

const getTabLabel = (tab: StaffTab): string => {
  switch (tab) {
    case 'ready':
      return 'Ready to Claim';
    case 'active':
      return 'Awaiting Parcel';
    case 'unpaid':
      return 'Payment Required';
    case 'claimed':
      return 'Claimed';
    case 'all':
    default:
      return 'All Orders';
  }
};

export const StaffTerminalScreen: React.FC = () => {
  const { staffUser } = useStaffAuth();

  // Screen-local UI state (no StaffUiContext needed)
  const [activeTab, setActiveTab] = useState<StaffTab>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<StaffOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isLookupOpen, setIsLookupOpen] = useState<boolean>(false);
  const [isDeskInfoOpen, setIsDeskInfoOpen] = useState<boolean>(false);
  const [justUpdatedOrder, setJustUpdatedOrder] = useState<JustUpdatedOrderInfo | null>(null);

  const {
    orders,
    filteredOrders,
    allCachedOrders,
    isLoadingOrders,
    totalCount,
    badgeCounts,
    isRefreshing,
    refreshOrders,
    findOrderByQrCode,
  } = useStaffOrders(activeTab, currentPage, searchQuery);

  // Keep selectedOrder synced when background polling refreshes the active list
  useEffect(() => {
    if (!selectedOrder) return;
    const fresh = allCachedOrders.find((o) => o.id === selectedOrder.id);
    if (!fresh) return;
    setSelectedOrder((prev) =>
      prev && prev.id === fresh.id
        ? {
            ...fresh,
            notes: prev.notes,
            proofImageUrl: prev.proofImageUrl || fresh.proofImageUrl,
          }
        : prev
    );
  }, [allCachedOrders]);

  const handleSelectTab = (tab: StaffTab) => {
    if (justUpdatedOrder) setJustUpdatedOrder(null);
    if (searchQuery) setSearchQuery('');
    setActiveTab(tab);
  };

  const handleOpenOrderDetails = async (order: StaffOrder, hasDetails = false) => {
    if (justUpdatedOrder) setJustUpdatedOrder(null);
    setSelectedOrder(order);
    setIsDetailsOpen(true);
    if (hasDetails || !staffUser?.token) return;
    try {
      const detail = await staffApi.getOrder(order.id, staffUser.token);
      setSelectedOrder((prev) =>
        prev && prev.id === order.id
          ? {
              ...prev,
              ...detail,
              amountReceived: detail.amountReceived ?? prev.amountReceived,
              change: detail.change || prev.change,
              notes: prev.notes,
              claimedAt: prev.claimedAt || detail.claimedAt,
              createdAt: detail.createdAt || prev.createdAt,
              statusTimeline: detail.statusTimeline || prev.statusTimeline,
              proofImageUrl: detail.proofImageUrl || prev.proofImageUrl || order.proofImageUrl,
            }
          : prev
      );
    } catch {}
  };

  const closeOrderDetails = () => {
    setIsDetailsOpen(false);
    setSelectedOrder(null);
  };

  // 20 items per page (server-side paginated)
  const ITEMS_PER_PAGE = 20;

  // Reset to page 1 whenever active tab or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, setCurrentPage]);

  // Total items for current view (server-authoritative count per tab and search)
  const totalItems = totalCount > 0 ? totalCount : filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  // Current page records (already sliced by server)
  const pagedOrders = filteredOrders;

  // Accurate record range indicators
  const startRecord = totalItems === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endRecord = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  // Range text for display (e.g. "1-12 out of 12" or "1-20 out of 45")
  const rangeDisplay = isLoadingOrders
    ? 'Fetching records...'
    : totalItems > 0
    ? `${startRecord}-${endRecord} out of ${totalItems}`
    : '0 out of 0';

  // Compute visible page numbers (up to 4 page numbers)
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = Math.min(4, totalPages);
    let startPage = Math.max(1, currentPage - 1);
    if (startPage + maxVisible - 1 > totalPages) {
      startPage = Math.max(1, totalPages - maxVisible + 1);
    }
    for (let i = 0; i < maxVisible; i++) {
      pages.push(startPage + i);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <View className="flex-1 bg-black">
      {/* Top Header matching Figma 1332:841 */}
      <StaffHeader onOpenAccount={() => setIsDeskInfoOpen(true)} />

      {/* Main Sheet with curved top corners */}
      <View
        style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
        className="flex-1 bg-[#F8FAFC] overflow-hidden relative"
      >
        {/* Fixed Sheet Controls: Search & QR Wing Button */}
        <StaffSearchBar
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            if (justUpdatedOrder) setJustUpdatedOrder(null);
            setSearchQuery(q);
          }}
          onClear={() => setSearchQuery('')}
          onOpenLookup={() => setIsLookupOpen(true)}
        />

        {/* Fixed Tab Filter Pills */}
        <StaffFilterTabs
          activeTab={activeTab}
          badgeCounts={badgeCounts}
          onSelectTab={handleSelectTab}
        />

        {/* Section Title Header */}
        <View className="px-5 pt-2 pb-1.5 flex-row items-center justify-between">
          <Text className="text-[11px] font-semibold text-[#6B7280] tracking-[0.55px] uppercase">
            {searchQuery.trim() ? 'SEARCH RESULTS' : 'RECENT ACTIVITIES'}
          </Text>
        </View>

        {/* Middle Scrollable Content (List of 20 orders per page) */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                if (justUpdatedOrder) setJustUpdatedOrder(null);
                refreshOrders();
              }}
              tintColor="#2563EB"
              colors={['#2563EB']}
            />
          }
        >
          {/* Flat pure white container with no border or drop shadow outline */}
          <View
            style={{ borderWidth: 0, shadowOpacity: 0, elevation: 0, overflow: 'hidden' }}
            className="bg-white rounded-[20px] overflow-hidden"
          >
            {isLoadingOrders ? (
              <View className="p-4">
                <StaffOrderCardSkeleton count={5} />
              </View>
            ) : pagedOrders.length > 0 || justUpdatedOrder ? (
              (() => {
                const liveOrder = justUpdatedOrder
                  ? pagedOrders.find((o) => o.id === justUpdatedOrder.orderId) ||
                    orders.find((o) => o.id === justUpdatedOrder.orderId) ||
                    allCachedOrders.find((o) => o.id === justUpdatedOrder.orderId)
                  : null;

                const remainingOrders = liveOrder
                  ? pagedOrders.filter((o) => o.id !== liveOrder.id)
                  : pagedOrders;

                return (
                  <>
                    {liveOrder && justUpdatedOrder && (
                      <StaffLiveUpdatedRow
                        key={`live-${liveOrder.id}`}
                        order={liveOrder}
                        actionBadgeText={justUpdatedOrder.actionBadgeText}
                        targetBadgeText={justUpdatedOrder.targetBadgeText}
                        targetStatus={justUpdatedOrder.targetStatus}
                        onPress={handleOpenOrderDetails}
                        showDivider={remainingOrders.length > 0}
                      />
                    )}
                    {remainingOrders.map((order, idx) => (
                      <StaffOrderCard
                        key={`${order.id}-${idx}`}
                        order={order}
                        onPress={handleOpenOrderDetails}
                        showDivider={idx < remainingOrders.length - 1}
                      />
                    ))}
                  </>
                );
              })()
            ) : searchQuery.trim() ? (
              <View className="items-center justify-center py-12 px-4">
                <View className="w-12 h-12 rounded-2xl bg-[#F1F5F9] items-center justify-center mb-2.5">
                  <Inbox size={22} color="#94A3B8" />
                </View>
                <Text className="text-sm font-bold text-[#0F172A]">
                  No activities found
                </Text>
                <Text className="text-xs text-[#64748B] text-center mt-1 mb-4">
                  No orders matching "{searchQuery}"
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSearchQuery('')}
                  className="bg-[#2563EB] px-4 py-2 rounded-xl"
                >
                  <Text className="text-xs font-semibold text-white">
                    Clear Search
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="items-center justify-center py-12 px-4">
                <View className="w-12 h-12 rounded-2xl bg-[#F1F5F9] items-center justify-center mb-2.5">
                  <Inbox size={22} color="#94A3B8" />
                </View>
                <Text className="text-sm font-bold text-[#0F172A]">
                  {activeTab === 'all'
                    ? 'No activities found'
                    : `No ${getTabLabel(activeTab)} orders`}
                </Text>
                <Text className="text-xs text-[#64748B] text-center mt-1">
                  {activeTab === 'all'
                    ? 'There are currently no orders in the terminal queue.'
                    : `There are currently no parcels in the ${getTabLabel(activeTab)} queue.`}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Fixed Bottom Pagination Bar (Always pinned at bottom whether there are orders or not) */}
        <View
          style={{
            zIndex: 10,
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
          }}
          className="bg-[#F8FAFC] px-5 pt-2.5 pb-6 items-center"
        >
          {/* Accurate Record Range Indicator */}
          <Text className="text-[12px] font-medium text-[#475569] mb-2">
            {rangeDisplay}
          </Text>

          {/* Pagination Controls */}
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

            {/* Page Number Pills */}
            {pageNumbers.map((pageNum) => {
              const isActive = currentPage === pageNum;
              return (
                <TouchableOpacity
                  key={`page-${pageNum}`}
                  onPress={() => setCurrentPage(pageNum)}
                  activeOpacity={0.8}
                  className={`w-10 h-10 rounded-[12px] items-center justify-center ${
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
            })}

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

        {/* In-sheet QR Scanner View (Figma node 1355:3) */}
        <StaffScanQrModal
          isOpen={isLookupOpen}
          onClose={() => setIsLookupOpen(false)}
          onSelectOrder={handleOpenOrderDetails}
          findOrderByQrCode={findOrderByQrCode}
        />
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
        onOrderUpdated={(updated) =>
          setSelectedOrder((prev) => (prev && prev.id === updated.id ? updated : prev))
        }
        onSelectTab={handleSelectTab}
        onJustUpdated={setJustUpdatedOrder}
      />
    </View>
  );
};
