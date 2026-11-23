import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { OrderId, ScreenshotSourceApp } from '../types/api';

export type OrderDraft = {
  readonly orderId?: OrderId | null;
  readonly ticketCode?: string | null;
  readonly imageUrl?: string | null;
  readonly previewUri?: string | null;
  readonly trackingId?: string;
  readonly productName?: string;
  readonly recipientName?: string;
  readonly price?: number;
  readonly totalAmount?: string;
  readonly trackingIdLocked?: boolean;
  readonly sourceApp?: ScreenshotSourceApp;
};

const DEFAULT_ORDER_DRAFT: OrderDraft = {
  orderId: null,
  ticketCode: null,
  imageUrl: null,
  previewUri: null,
  trackingId: '',
  productName: '',
  recipientName: '',
  price: 0,
  totalAmount: '',
};

export type OrderDraftContextType = {
  readonly orderDraft: OrderDraft;
  readonly updateOrderDraft: (partial: Partial<OrderDraft>) => void;
  readonly clearOrderDraft: () => void;
};

const OrderDraftContext = createContext<OrderDraftContextType | undefined>(undefined);

/**
 * Holds in-progress order creation draft state shared across CreateOrderScreen and ConfirmOrderScreen.
 */
export const OrderDraftProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orderDraft, setOrderDraft] = useState<OrderDraft>(DEFAULT_ORDER_DRAFT);

  const updateOrderDraft = useCallback((partial: Partial<OrderDraft>) => {
    setOrderDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const clearOrderDraft = useCallback(() => {
    setOrderDraft(DEFAULT_ORDER_DRAFT);
  }, []);

  const value = useMemo<OrderDraftContextType>(
    () => ({
      orderDraft,
      updateOrderDraft,
      clearOrderDraft,
    }),
    [orderDraft, updateOrderDraft, clearOrderDraft]
  );

  return <OrderDraftContext.Provider value={value}>{children}</OrderDraftContext.Provider>;
};

export const useOrderDraft = (): OrderDraftContextType => {
  const context = useContext(OrderDraftContext);
  if (!context) {
    throw new Error('useOrderDraft must be used within an OrderDraftProvider');
  }
  return context;
};
