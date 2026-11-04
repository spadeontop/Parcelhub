import React from 'react';
import { useStaffTerminal } from './hooks/useStaffTerminal';
import { StaffHeader } from './components/header/StaffHeader';
import { StaffSearchBar } from './components/header/StaffSearchBar';
import { StaffOrdersList } from './components/cards/StaffOrdersList';
import { StaffScanFab } from './components/navigation/StaffScanFab';
import { StaffFilterTabs } from './components/navigation/StaffFilterTabs';
import { StaffBottomNav } from './components/navigation/StaffBottomNav';
import { StaffOrderDetailsModal } from './components/modals/details/StaffOrderDetailsModal';
import { StaffQrScannerModal } from './components/modals/scanner/StaffQrScannerModal';

export const StaffTerminal: React.FC = () => {
  const {
    orders,
    filteredOrders,
    staffFilter,
    setStaffFilter,
    staffSearchQuery,
    setStaffSearchQuery,
    crossTabMatches,
    badgeCounts,
    activeModalOrder,
    isDetailsOpen,
    isScannerOpen,
    setIsScannerOpen,
    handleOpenDetails,
    handleCloseDetails,
    handleSearchOrBarcodeScan,
    handleQrMatched,
    handleUpdateNotes,
    getOrderStatedFee,
    setRoleMode,
    staffActivateOrder,
    staffPayCourier,
    staffAttachPhoto,
    staffReleaseOrder,
    customerInitiateClaim,
    isOrderClaimUnlocked,
    getOrderClaimRemainingSeconds,
    showToast,
  } = useStaffTerminal();

  return (
    <div className="flex flex-col min-h-[780px] bg-slate-900 text-slate-100 relative select-none font-sans overflow-hidden">
      {/* Staff Terminal Header (Frame 109 from Figma Spec) */}
      <StaffHeader onExit={() => setRoleMode('user')}>
        <StaffSearchBar
          searchQuery={staffSearchQuery}
          onSearchChange={setStaffSearchQuery}
          onTriggerSearchOrScan={handleSearchOrBarcodeScan}
          onClear={() => setStaffSearchQuery('')}
        />
      </StaffHeader>

      {/* Cards Area (Frame 114 from Figma Spec - Showcase Mode) */}
      <StaffOrdersList
        orders={filteredOrders}
        searchQuery={staffSearchQuery}
        crossTabMatches={crossTabMatches}
        onOpenDetails={handleOpenDetails}
        onSelectFilter={setStaffFilter}
        getOrderFee={getOrderStatedFee}
      />

      {/* Floating Scan QR Action Button: Lower Right Side for Thumb Accessibility */}
      <StaffScanFab onClick={() => setIsScannerOpen(true)} />

      {/* Filter Area (Frame 111 from Suggested Figma Spec) */}
      <StaffFilterTabs
        activeFilter={staffFilter}
        badgeCounts={badgeCounts}
        onSelectFilter={setStaffFilter}
      />

      {/* Navigation Area (Frame 113 from Suggested Figma Spec) */}
      <StaffBottomNav
        onNavigateHome={() => setStaffFilter('active')}
        onOpenScanner={() => setIsScannerOpen(true)}
        onViewActivity={() => {
          setStaffFilter('claimed');
          showToast('Viewing completed activity log.');
        }}
        onShowDeskInfo={() => showToast('Counter Desk #01 • Connected to Lily’s Hub Backend.')}
      />

      {/* Dedicated Inner Order Details & Actions Modal (Frame 114 Drill-Down) */}
      <StaffOrderDetailsModal
        order={activeModalOrder}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        onPayCourier={staffPayCourier}
        onAttachPhoto={staffAttachPhoto}
        onActivateOrder={staffActivateOrder}
        onReleaseOrder={staffReleaseOrder}
        onUpdateNotes={handleUpdateNotes}
        onSimulatePrompt={customerInitiateClaim}
        isOrderClaimUnlocked={isOrderClaimUnlocked}
        getOrderClaimRemainingSeconds={getOrderClaimRemainingSeconds}
        showToast={showToast}
      />

      {/* Dedicated QR Scanner Modal Screen */}
      <StaffQrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onOrderMatched={handleQrMatched}
        orders={orders}
        showToast={showToast}
      />
    </div>
  );
};

export default StaffTerminal;

