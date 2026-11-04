import { OrderStatus } from './domain';
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}
export type RouteRole = 'staff' | 'customer';
export interface CustomerOrderSummary {
    productName: string;
    status: OrderStatus;
    timestamp: string;
}
export interface CustomerOrdersResponse {
    statusMessage: string;
    order: CustomerOrderSummary[];
}
export interface InitializeOrderRequest {
    authToken?: string;
    imageUrl: string;
    productName?: string;
    recipientName?: string;
    trackingId?: string;
    price?: number;
}
export interface InitializeOrderResponse {
    orderId: string;
    statusMessage: string;
}
export interface UpdateOrderRequest {
    authToken?: string;
    order: {
        trackingId?: string;
        productName?: string;
        recepientName?: string;
        price?: number;
    };
}
export interface StaffActivateOrderRequest {
    authToken?: string;
    amountReceived: number;
}
export interface StaffActivateOrderResponse {
    statusMessage: string;
    change: number;
}
export interface StaffPayCourierRequest {
    authToken?: string;
}
export interface StaffPayCourierResponse {
    statusMessage: string;
}
export interface StaffAttachPhotoRequest {
    authToken?: string;
    imageUrl: string;
}
export interface StaffAttachPhotoResponse {
    statusMessage: string;
    imageUrl: string;
}
export interface ClaimOrderRequest {
    authToken?: string;
}
export interface ClaimOrderResponse {
    statusMessage: string;
}
//# sourceMappingURL=api.d.ts.map