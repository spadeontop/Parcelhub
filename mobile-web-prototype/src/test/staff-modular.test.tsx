import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  StaffBadge,
  StaffEmptyState,
  StaffOrderCard,
  StaffFilterTabs,
  StaffSearchBar,
  StaffOrderHeroBanner,
  StaffUnpaidActionSection,
  StaffReadyActionSection,
  StaffOrderDetailsModal,
  StaffQrScannerModal,
  StaffTerminal,
  formatOrderId,
} from '../staff';
import { AppProvider } from '../context/AppContext';
import { Order } from '../types';

const createMockOrder = (overrides?: Partial<Order>): Order => ({
  id: 'ORD-123',
  product: 'Test Item',
  recipient: 'Test User',
  paidAmount: '₱500',
  codAmount: '₱480',
  change: '₱20',
  trackingNumber: 'PH-123',
  refCode: 'REF-123',
  alphanumericKey: 'KEY123',
  envelopeNumber: 'ENV-123',
  status: 'AWAITING_PARCEL',
  orderPlacedTime: '10:00 AM',
  awaitingParcelTime: '10:30 AM',
  readyToClaimTime: null,
  claimedTime: null,
  dateLabel: 'Oct 31',
  carrier: 'J&T Express',
  hubLocation: 'Lily Hub #01',
  ...overrides,
});

describe('Staff Module Decoupled & Optimized Components', () => {
  it('correctly formats order IDs with formatOrderId', () => {
    expect(formatOrderId('')).toBe('');
    expect(formatOrderId('ORD408')).toBe('ORD - 408');
    expect(formatOrderId('ORD - 408')).toBe('ORD - 408');
    expect(formatOrderId('ORD-408')).toBe('ORD - 408');
    expect(formatOrderId('ORD 408')).toBe('ORD - 408');
    expect(formatOrderId('PH-402-5544')).toBe('PH - 402-5544');
  });

  it('renders StaffBadge with appropriate variant and classes and safely handles edge cases', () => {
    const { rerender } = render(<StaffBadge status="AWAITING_PARCEL" variant="card" />);
    expect(screen.getByText('Active')).toBeInTheDocument();

    rerender(<StaffBadge status="READY_TO_CLAIM" variant="modal" />);
    expect(screen.getByText('Ready')).toBeInTheDocument();

    rerender(<StaffBadge status="PAYMENT_REQUIRED" />);
    expect(screen.getByText('Unpaid')).toBeInTheDocument();

    rerender(<StaffBadge status="CLAIMED" />);
    expect(screen.getByText('Claimed')).toBeInTheDocument();

    // Safely handles empty/undefined status without throwing
    rerender(<StaffBadge status={'' as any} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders StaffEmptyState and handles crosstab button clicks', () => {
    const handleFilter = vi.fn();
    const crossOrder = createMockOrder({
      id: 'ORD-408',
      product: 'Poco X6 Pro',
      recipient: 'John Doe',
      paidAmount: '₱12,500',
      codAmount: '₱12,450',
      change: '₱50',
      status: 'AWAITING_PARCEL',
      trackingNumber: 'PH-408-9999',
      alphanumericKey: 'ABC123',
    });

    render(
      <StaffEmptyState
        searchQuery="Poco"
        crossTabMatches={[crossOrder]}
        onSelectFilter={handleFilter}
      />
    );

    expect(screen.getByText(/No parcels found matching "Poco"/i)).toBeInTheDocument();
    const crossTabBtn = screen.getByText(/View/i);
    fireEvent.click(crossTabBtn);
    expect(handleFilter).toHaveBeenCalledWith('active');
  });

  it('renders StaffSearchBar and triggers search on Enter key and scan button', () => {
    const handleSearch = vi.fn();
    const handleClear = vi.fn();
    const handleChange = vi.fn();

    const { rerender } = render(
      <StaffSearchBar
        searchQuery=""
        onSearchChange={handleChange}
        onTriggerSearchOrScan={handleSearch}
        onClear={handleClear}
      />
    );

    const input = screen.getByLabelText('Staff Search Key or Waybill');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(handleSearch).toHaveBeenCalledTimes(1);

    const scanBtn = screen.getByLabelText('Scan Barcode');
    fireEvent.click(scanBtn);
    expect(handleSearch).toHaveBeenCalledTimes(2);

    rerender(
      <StaffSearchBar
        searchQuery="sample query"
        onSearchChange={handleChange}
        onTriggerSearchOrScan={handleSearch}
        onClear={handleClear}
      />
    );

    const clearBtn = screen.getByLabelText('Clear Search');
    fireEvent.click(clearBtn);
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it('renders StaffOrderCard and handles keyboard navigation (Enter and Space)', () => {
    const handleOpen = vi.fn();
    const order = createMockOrder({
      id: 'ORD-999',
      product: 'Test Gadget',
      recipient: 'Tester',
      paidAmount: '₱1,000',
      codAmount: '₱900',
      change: '₱100',
      status: 'PAYMENT_REQUIRED',
      trackingNumber: 'PH-999',
      alphanumericKey: 'KEY999',
      notes: 'Urgent pickup',
    });

    render(<StaffOrderCard order={order} fee={1000} onOpenDetails={handleOpen} />);

    expect(screen.getByText('Test Gadget')).toBeInTheDocument();
    expect(screen.getByText('Fee: ₱1,000')).toBeInTheDocument();
    expect(screen.getByText('Urgent pickup')).toBeInTheDocument();

    const card = screen.getByRole('button', { name: /View complete details and actions for ORD-999/i });
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(handleOpen).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: ' ' });
    expect(handleOpen).toHaveBeenCalledTimes(2);
  });

  it('renders StaffFilterTabs with dynamic badge counts', () => {
    const handleSelect = vi.fn();
    const counts = { active: 3, ready: 2, unpaid: 5, claimed: 10 };

    render(
      <StaffFilterTabs
        activeFilter="active"
        badgeCounts={counts}
        onSelectFilter={handleSelect}
      />
    );

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Ready'));
    expect(handleSelect).toHaveBeenCalledWith('ready_to_claim');
  });

  it('handles StaffOrderHeroBanner copy ID', () => {
    const handleCopy = vi.fn();
    const order = createMockOrder({
      id: 'ORD-123',
      product: 'Package',
      recipient: 'User',
      paidAmount: '₱500',
      codAmount: '₱500',
      status: 'READY_TO_CLAIM',
      trackingNumber: 'PH-123',
      alphanumericKey: 'KEY123',
    });

    render(
      <StaffOrderHeroBanner
        order={order}
        formattedOrderId="ORD - 123"
        onCopyId={handleCopy}
      />
    );

    expect(screen.getByText('ORD - 123')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Copy Internal Order ID'));
    expect(handleCopy).toHaveBeenCalledTimes(1);
  });

  it('handles StaffUnpaidActionSection preset cash buttons', () => {
    const handleInputChange = vi.fn();
    const handleActivate = vi.fn();
    const order = createMockOrder({
      id: 'ORD-123',
      product: 'Package',
      recipient: 'User',
      paidAmount: '₱500',
      codAmount: '₱480',
      status: 'PAYMENT_REQUIRED',
      trackingNumber: 'PH-123',
      alphanumericKey: 'KEY123',
    });

    render(
      <StaffUnpaidActionSection
        order={order}
        fee={500}
        cashInput="600"
        onCashInputChange={handleInputChange}
        onActivateOrder={handleActivate}
      />
    );

    // Preset button
    const exactBtn = screen.getByText('Exact ₱500');
    fireEvent.click(exactBtn);
    expect(handleInputChange).toHaveBeenCalledWith('500');

    // Activate button
    const activateBtn = screen.getByRole('button', { name: 'Receive Cash & Activate' });
    fireEvent.click(activateBtn);
    expect(handleActivate).toHaveBeenCalledWith('ORD-123', 600);
  });

  it('handles StaffReadyActionSection simulate claim prompt and release', () => {
    const handleSimulate = vi.fn();
    const handleRelease = vi.fn();
    const order = createMockOrder({
      id: 'ORD-123',
      product: 'Package',
      recipient: 'User',
      paidAmount: '₱500',
      codAmount: '₱480',
      change: '₱20',
      status: 'READY_TO_CLAIM',
      trackingNumber: 'PH-123',
      alphanumericKey: 'KEY123',
    });

    // When locked
    const { rerender } = render(
      <StaffReadyActionSection
        order={order}
        unlocked={false}
        timeFormatted="10:00"
        onSimulatePrompt={handleSimulate}
        onReleaseOrder={handleRelease}
      />
    );

    const simBtn = screen.getByText('Simulate Customer Claim Prompt');
    fireEvent.click(simBtn);
    expect(handleSimulate).toHaveBeenCalledTimes(1);

    // When unlocked
    rerender(
      <StaffReadyActionSection
        order={order}
        unlocked={true}
        timeFormatted="09:45"
        onSimulatePrompt={handleSimulate}
        onReleaseOrder={handleRelease}
      />
    );

    expect(screen.getByText('Customer Present at Counter')).toBeInTheDocument();
    const releaseBtn = screen.getByRole('button', { name: 'Release' });
    fireEvent.click(releaseBtn);
    expect(handleRelease).toHaveBeenCalledWith('ORD-123');
  });

  it('renders StaffQrScannerModal and formats manual lookup input to XXX - XXX', () => {
    const handleMatch = vi.fn();
    const handleClose = vi.fn();
    const mockOrder = createMockOrder({ id: 'ORD-408', product: 'Poco X6 Pro' });

    render(
      <StaffQrScannerModal
        isOpen={true}
        onClose={handleClose}
        onOrderMatched={handleMatch}
        orders={[mockOrder]}
        showToast={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('ORD - 408') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ord408' } });
    expect(input.value).toBe('ORD - 408');

    const lookupBtn = screen.getByRole('button', { name: 'Lookup' });
    fireEvent.click(lookupBtn);
    expect(handleMatch).toHaveBeenCalledWith(mockOrder);
    expect(handleClose).toHaveBeenCalled();
  });

  it('handles StaffOrderDetailsModal note editing, copy buttons, and closing', () => {
    const handleNotes = vi.fn();
    const handleClose = vi.fn();
    const order = createMockOrder({
      id: 'ORD-123',
      product: 'Test Item',
      trackingNumber: 'PH-123',
      notes: '',
      status: 'AWAITING_PARCEL',
    });

    render(
      <StaffOrderDetailsModal
        order={order}
        isOpen={true}
        onClose={handleClose}
        onPayCourier={vi.fn()}
        onAttachPhoto={vi.fn()}
        onActivateOrder={vi.fn()}
        onReleaseOrder={vi.fn()}
        onUpdateNotes={handleNotes}
        showToast={vi.fn()}
      />
    );

    // Save staff note
    const textarea = screen.getByPlaceholderText(/Add operational notes/i);
    fireEvent.change(textarea, { target: { value: 'Customer will pick up after 5pm' } });
    const saveBtn = screen.getByRole('button', { name: 'Save Note' });
    fireEvent.click(saveBtn);
    expect(handleNotes).toHaveBeenCalledWith('ORD-123', 'Customer will pick up after 5pm');

    // Close button
    const backBtn = screen.getByRole('button', { name: 'Back to Terminal' });
    fireEvent.click(backBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('integrates StaffTerminal with AppProvider: card click opens details and note editing updates card preview', () => {
    render(
      <AppProvider>
        <StaffTerminal />
      </AppProvider>
    );

    // Active tab has Poco X6 Pro (ORD-408)
    const card = screen.getByRole('button', { name: /View complete details and actions for ORD-408/i });
    expect(card).toBeInTheDocument();

    // Click card to open modal
    fireEvent.click(card);

    // Details modal is now visible with ORD - 408
    expect(screen.getAllByText('ORD - 408').length).toBeGreaterThanOrEqual(1);

    // Edit notes inside modal
    const textarea = screen.getByPlaceholderText(/Add operational notes/i);
    fireEvent.change(textarea, { target: { value: 'Updated via Terminal Integration Test' } });
    const saveBtn = screen.getByRole('button', { name: 'Save Note' });
    fireEvent.click(saveBtn);

    // Close details
    const backBtn = screen.getByRole('button', { name: 'Back to Terminal' });
    fireEvent.click(backBtn);

    // Verify notes preview is rendered on card in list
    expect(screen.getByText('Updated via Terminal Integration Test')).toBeInTheDocument();
  });
});

