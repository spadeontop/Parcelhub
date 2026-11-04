export type OrderStatus = 'PAYMENT_REQUIRED' | 'AWAITING_PARCEL' | 'READY_TO_CLAIM' | 'CLAIMED';
export type TransactionFilter = 'ALL' | 'READY_TO_CLAIM' | 'AWAITING_PARCEL' | 'PAYMENT_REQUIRED' | 'CLAIMED';
export type StaffFilter = 'active' | 'ready_to_claim' | 'claimed' | 'inactive';
export type RoleMode = 'user' | 'staff';
export type ViewMode = 'device' | 'fullscreen';
export interface Order {
    id: string;
    product: string;
    recipient: string;
    paidAmount: string;
    codAmount: string;
    change: string;
    trackingNumber: string;
    refCode: string;
    alphanumericKey: string;
    envelopeNumber: string;
    status: OrderStatus;
    orderPlacedTime: string;
    awaitingParcelTime: string | null;
    readyToClaimTime: string | null;
    claimedTime: string | null;
    dateLabel: string;
    carrier: string;
    hubLocation: string;
    courierPaid?: boolean;
    parcelImageUrl?: string | null;
    claimInitiatedAt?: number | null;
    notes?: string;
    statedFee?: number;
}
export interface DraftOrder {
    product: string;
    recipient: string;
    totalAmount: string;
    trackingId: string;
    receiptUri: string;
}
export interface ToastState {
    show: boolean;
    message: string;
}
//# sourceMappingURL=domain.d.ts.map