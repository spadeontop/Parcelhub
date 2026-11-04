import { Order, OrderStatus } from '../types/domain';
import { ApiResponse } from '../types/api';
export declare const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]>;
export declare function canTransition(from: OrderStatus, to: OrderStatus): boolean;
export declare const orderStateMachine: {
    /**
     * POST /api/staff/orders/{id}/activate
     * Staff logs cash deposit received from customer to activate the order.
     */
    staffActivate: (order: Order, amountReceived: number | string) => ApiResponse<Order>;
    /**
     * POST /api/staff/orders/{id}/make-claimable/pay
     * Hub staff disburses cash payment to courier upon parcel arrival.
     */
    staffPayCourier: (order: Order) => ApiResponse<Order>;
    /**
     * POST /api/staff/orders/{id}/make-claimable/attach-photo
     * Hub staff attaches parcel proof photo. Advances order to READY_TO_CLAIM.
     */
    staffAttachPhoto: (order: Order, imageUrl: string) => ApiResponse<Order>;
    /**
     * POST /api/customer/orders/{id}/claim
     * Customer initiates claim, unlocking staff release for cutoffMins.
     */
    customerInitiateClaim: (order: Order, cutoffMins?: number, hubOpen?: boolean) => ApiResponse<Order>;
    /**
     * POST /api/staff/orders/{id}/claim
     * Staff releases parcel to customer once unlocked.
     */
    staffRelease: (order: Order, cutoffMins?: number) => ApiResponse<Order>;
};
//# sourceMappingURL=orderStateMachine.d.ts.map