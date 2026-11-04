import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, StaffFilter, StaffBadgeCounts } from '../types';

export interface UseStaffTerminalResult {
  orders: Order[];
  filteredOrders: Order[];
  staffFilter: StaffFilter;
  setStaffFilter: (filter: StaffFilter) => void;
  staffSearchQuery: string;
  setStaffSearchQuery: (q: string) => void;
  crossTabMatches: Order[];
  badgeCounts: StaffBadgeCounts;
  selectedModalOrder: Order | null;
  activeModalOrder: Order;
  isDetailsOpen: boolean;
  setIsDetailsOpen: (open: boolean) => void;
  isScannerOpen: boolean;
  setIsScannerOpen: (open: boolean) => void;
  handleOpenDetails: (order: Order) => void;
  handleCloseDetails: () => void;
  handleSearchOrBarcodeScan: () => void;
  handleQrMatched: (order: Order) => void;
  handleUpdateNotes: (orderId: string, notes: string) => void;
  getOrderStatedFee: (order: Order) => number;
  setRoleMode: (mode: 'user' | 'staff') => void;
  staffActivateOrder: (orderId: string, amount: number) => boolean | void;
  staffPayCourier: (orderId: string) => void;
  staffAttachPhoto: (orderId: string, imageUrl: string) => boolean | void;
  staffReleaseOrder: (orderId: string) => boolean | void;
  customerInitiateClaim: (orderId: string) => void;
  isOrderClaimUnlocked: (order: Order) => boolean;
  getOrderClaimRemainingSeconds: (order: Order) => number;
  showToast: (msg: string) => void;
}

export function useStaffTerminal(): UseStaffTerminalResult {
  const {
    orders,
    staffFilter,
    setStaffFilter,
    staffSearchQuery,
    setStaffSearchQuery,
    setRoleMode,
    staffActivateOrder,
    staffPayCourier,
    staffAttachPhoto,
    staffReleaseOrder,
    customerInitiateClaim,
    isOrderClaimUnlocked,
    getOrderClaimRemainingSeconds,
    getOrderStatedFee,
    getCurrentOrder,
    selectedOrderId,
    showToast,
  } = useApp();

  const [selectedModalOrder, setSelectedModalOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [, setTick] = useState<number>(0);

  // Compute badge counts for tabs
  const badgeCounts: StaffBadgeCounts = useMemo(() => ({
    active: orders.filter((o) => o.status === 'AWAITING_PARCEL').length,
    ready: orders.filter((o) => o.status === 'READY_TO_CLAIM').length,
    unpaid: orders.filter((o) => o.status === 'PAYMENT_REQUIRED').length,
    claimed: orders.filter((o) => o.status === 'CLAIMED').length,
  }), [orders]);

  // Filter list by tab
  const tabOrders = useMemo(() => {
    if (staffFilter === 'active') {
      return orders.filter((o) => o.status === 'AWAITING_PARCEL');
    } else if (staffFilter === 'ready_to_claim') {
      return orders.filter((o) => o.status === 'READY_TO_CLAIM');
    } else if (staffFilter === 'claimed') {
      return orders.filter((o) => o.status === 'CLAIMED');
    } else if (staffFilter === 'inactive') {
      return orders.filter((o) => o.status === 'PAYMENT_REQUIRED');
    }
    return orders;
  }, [orders, staffFilter]);

  // Filter by search query
  const q = staffSearchQuery.trim().toLowerCase();
  const cleanQ = q.replace(/[^a-z0-9]/g, '');

  const filteredOrders = useMemo(() => {
    if (!q) return tabOrders;
    return tabOrders.filter((o) => {
      const id = o.id.toLowerCase();
      const key = o.alphanumericKey.toLowerCase();
      const cleanKey = key.replace(/[^a-z0-9]/g, '');
      const track = o.trackingNumber.toLowerCase();
      const prod = o.product.toLowerCase();
      const rec = o.recipient.toLowerCase();
      const notes = (o.notes || '').toLowerCase();
      return (
        id.includes(q) ||
        key.includes(q) ||
        cleanKey.includes(cleanQ) ||
        track.includes(q) ||
        prod.includes(q) ||
        rec.includes(q) ||
        notes.includes(q)
      );
    });
  }, [tabOrders, q, cleanQ]);

  // Cross-tab matches if current list is empty
  const crossTabMatches = useMemo(() => {
    if (!q) return [];
    return orders.filter((o) => {
      const id = o.id.toLowerCase();
      const key = o.alphanumericKey.toLowerCase();
      const cleanKey = key.replace(/[^a-z0-9]/g, '');
      const track = o.trackingNumber.toLowerCase();
      const prod = o.product.toLowerCase();
      const rec = o.recipient.toLowerCase();
      const notes = (o.notes || '').toLowerCase();
      return (
        id.includes(q) ||
        key.includes(q) ||
        cleanKey.includes(cleanQ) ||
        track.includes(q) ||
        prod.includes(q) ||
        rec.includes(q) ||
        notes.includes(q)
      );
    });
  }, [orders, q, cleanQ]);

  const handleOpenDetails = useCallback((order: Order) => {
    setSelectedModalOrder(order);
    setIsDetailsOpen(true);
  }, []);

  const handleSearchOrBarcodeScan = useCallback(() => {
    const query = staffSearchQuery.trim();
    if (!query) {
      // Simulate Barcode Scan for current active order
      const current = getCurrentOrder();
      const barcode = current.trackingNumber || 'PH2696153366792H';

      if (current.status === 'PAYMENT_REQUIRED') {
        setStaffFilter('inactive');
      } else if (current.status === 'AWAITING_PARCEL') {
        setStaffFilter('active');
      } else if (current.status === 'READY_TO_CLAIM') {
        setStaffFilter('ready_to_claim');
      } else if (current.status === 'CLAIMED') {
        setStaffFilter('claimed');
      }

      setStaffSearchQuery(barcode);
      setSelectedModalOrder(current);
      showToast(`Barcode Scanner matched: ${barcode} (${current.product})`);
      return;
    }

    // Lookup matching order across all orders
    const cleanQuery = query.toLowerCase();
    const cleanAlnum = cleanQuery.replace(/[^a-z0-9]/g, '');

    const matched = orders.find((o) => {
      const id = o.id.toLowerCase();
      const cleanId = id.replace(/[^a-z0-9]/g, '');
      const track = o.trackingNumber.toLowerCase();
      const key = o.alphanumericKey.toLowerCase();
      const cleanKey = key.replace(/[^a-z0-9]/g, '');

      return (
        cleanId === cleanAlnum ||
        id === cleanQuery ||
        (cleanAlnum.length >= 3 && cleanId.endsWith(cleanAlnum)) ||
        track === cleanQuery ||
        key === cleanQuery ||
        cleanKey === cleanAlnum ||
        track.includes(cleanQuery) ||
        cleanQuery.includes(track)
      );
    });

    if (matched) {
      const targetFilter: StaffFilter =
        matched.status === 'PAYMENT_REQUIRED'
          ? 'inactive'
          : matched.status === 'AWAITING_PARCEL'
          ? 'active'
          : matched.status === 'READY_TO_CLAIM'
          ? 'ready_to_claim'
          : 'claimed';

      setStaffFilter(targetFilter);
      handleOpenDetails(matched);
      showToast(`Found match: ${matched.id} (${matched.product})`);
    } else {
      showToast(`Showing search results for "${query}".`);
    }
  }, [
    staffSearchQuery,
    getCurrentOrder,
    orders,
    setStaffFilter,
    setStaffSearchQuery,
    handleOpenDetails,
    showToast,
  ]);

  const handleQrMatched = useCallback((order: Order) => {
    const targetFilter: StaffFilter =
      order.status === 'PAYMENT_REQUIRED'
        ? 'inactive'
        : order.status === 'AWAITING_PARCEL'
        ? 'active'
        : order.status === 'READY_TO_CLAIM'
        ? 'ready_to_claim'
        : 'claimed';

    setStaffFilter(targetFilter);
    setStaffSearchQuery(order.id);
    handleOpenDetails(order);
  }, [setStaffFilter, setStaffSearchQuery, handleOpenDetails]);

  const handleUpdateNotes = useCallback((orderId: string, notes: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (ord) {
      ord.notes = notes;
      setTick((t) => t + 1);
    }
  }, [orders]);

  const handleCloseDetails = useCallback(() => {
    setIsDetailsOpen(false);
    setSelectedModalOrder(null);
  }, []);

  const handleStaffActivateOrder = useCallback(
    (orderId: string, amount: number) => {
      const result = staffActivateOrder(orderId, amount);
      if (result !== false) {
        setStaffFilter('active');
      }
      return result;
    },
    [staffActivateOrder, setStaffFilter]
  );

  const handleStaffAttachPhoto = useCallback(
    (orderId: string, imageUrl: string) => {
      const result = staffAttachPhoto(orderId, imageUrl);
      if (result !== false) {
        setStaffFilter('ready_to_claim');
      }
      return result;
    },
    [staffAttachPhoto, setStaffFilter]
  );

  const handleStaffReleaseOrder = useCallback(
    (orderId: string) => {
      const result = staffReleaseOrder(orderId);
      if (result !== false) {
        setStaffFilter('claimed');
      }
      return result;
    },
    [staffReleaseOrder, setStaffFilter]
  );

  // Always derive the live updated order from `orders` by matching ID
  const liveSelectedOrder = useMemo(() => {
    if (!selectedModalOrder) return null;
    return orders.find((o) => o.id === selectedModalOrder.id) || selectedModalOrder;
  }, [orders, selectedModalOrder]);

  const isSelectedOrderInTab = useMemo(() => {
    if (!liveSelectedOrder) return false;
    return filteredOrders.some((o) => o.id === liveSelectedOrder.id);
  }, [liveSelectedOrder, filteredOrders]);

  // Determine which order to populate into the modal
  const currentOrderInTab = filteredOrders.find((o) => o.id === selectedOrderId);
  const activeModalOrder: Order =
    ((isDetailsOpen || isSelectedOrderInTab) && liveSelectedOrder ? liveSelectedOrder : null) ||
    currentOrderInTab ||
    filteredOrders[0] ||
    getCurrentOrder() ||
    orders[0];

  return {
    orders,
    filteredOrders,
    staffFilter,
    setStaffFilter,
    staffSearchQuery,
    setStaffSearchQuery,
    crossTabMatches,
    badgeCounts,
    selectedModalOrder,
    activeModalOrder,
    isDetailsOpen,
    setIsDetailsOpen,
    isScannerOpen,
    setIsScannerOpen,
    handleOpenDetails,
    handleCloseDetails,
    handleSearchOrBarcodeScan,
    handleQrMatched,
    handleUpdateNotes,
    getOrderStatedFee,
    setRoleMode,
    staffActivateOrder: handleStaffActivateOrder,
    staffPayCourier,
    staffAttachPhoto: handleStaffAttachPhoto,
    staffReleaseOrder: handleStaffReleaseOrder,
    customerInitiateClaim,
    isOrderClaimUnlocked,
    getOrderClaimRemainingSeconds,
    showToast,
  };
}

