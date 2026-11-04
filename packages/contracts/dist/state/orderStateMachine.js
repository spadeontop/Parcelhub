import { getStatedFee, parseCurrency, isClaimUnlocked } from '../utils/calculations.js';
export const VALID_STATUS_TRANSITIONS = {
    PAYMENT_REQUIRED: ['AWAITING_PARCEL'],
    AWAITING_PARCEL: ['READY_TO_CLAIM'],
    READY_TO_CLAIM: ['CLAIMED'],
    CLAIMED: [],
};
export function canTransition(from, to) {
    return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
export const orderStateMachine = {
    /**
     * POST /api/staff/orders/{id}/activate
     * Staff logs cash deposit received from customer to activate the order.
     */
    staffActivate: (order, amountReceived) => {
        if (order.status !== 'PAYMENT_REQUIRED') {
            return {
                success: false,
                message: `Order ${order.id} is not awaiting payment (current status: ${order.status}).`,
                error: 'INVALID_STATUS',
            };
        }
        const fee = getStatedFee(order);
        const parsedAmount = typeof amountReceived === 'string' ? parseCurrency(amountReceived) : Number(amountReceived);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return {
                success: false,
                message: 'A valid numeric payment amount is required.',
                error: 'INVALID_AMOUNT',
            };
        }
        if (parsedAmount < fee) {
            return {
                success: false,
                message: `Amount received (₱${parsedAmount.toLocaleString()}) is less than stated fee (₱${fee.toLocaleString()}).`,
                error: 'INSUFFICIENT_AMOUNT',
            };
        }
        const codNum = parseCurrency(order.codAmount);
        const change = Math.max(0, parsedAmount - codNum);
        const updated = {
            ...order,
            status: 'AWAITING_PARCEL',
            paidAmount: `₱${parsedAmount.toLocaleString()}`,
            change: `₱${change.toLocaleString()}`,
            awaitingParcelTime: 'Just now',
        };
        return {
            success: true,
            message: `Cash deposit received: ₱${parsedAmount.toLocaleString()}. Order activated and awaiting parcel.`,
            data: updated,
        };
    },
    /**
     * POST /api/staff/orders/{id}/make-claimable/pay
     * Hub staff disburses cash payment to courier upon parcel arrival.
     */
    staffPayCourier: (order) => {
        if (order.status !== 'AWAITING_PARCEL') {
            return {
                success: false,
                message: `Cannot pay courier for order in ${order.status} status.`,
                error: 'INVALID_STATUS',
            };
        }
        const updated = {
            ...order,
            courierPaid: true,
        };
        return {
            success: true,
            message: `Courier payout recorded (${order.codAmount}). Please attach parcel photo.`,
            data: updated,
        };
    },
    /**
     * POST /api/staff/orders/{id}/make-claimable/attach-photo
     * Hub staff attaches parcel proof photo. Advances order to READY_TO_CLAIM.
     */
    staffAttachPhoto: (order, imageUrl) => {
        if (order.status !== 'AWAITING_PARCEL') {
            return {
                success: false,
                message: `Cannot attach parcel photo for order in ${order.status} status.`,
                error: 'INVALID_STATUS',
            };
        }
        if (!order.courierPaid) {
            return {
                success: false,
                message: 'Cannot attach photo before courier payout is logged.',
                error: 'PAYMENT_PENDING',
            };
        }
        if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
            return {
                success: false,
                message: 'A valid parcel image is required.',
                error: 'INVALID_IMAGE',
            };
        }
        const updated = {
            ...order,
            parcelImageUrl: imageUrl.trim(),
            status: 'READY_TO_CLAIM',
            readyToClaimTime: 'Just now',
        };
        return {
            success: true,
            message: 'Parcel photo attached & verified. Order is now ready to claim.',
            data: updated,
        };
    },
    /**
     * POST /api/customer/orders/{id}/claim
     * Customer initiates claim, unlocking staff release for cutoffMins.
     */
    customerInitiateClaim: (order, cutoffMins = 5, hubOpen = true) => {
        if (!hubOpen) {
            return {
                success: false,
                message: 'Cannot initiate claim when the hub is closed.',
                error: 'HUB_CLOSED',
            };
        }
        if (order.status !== 'READY_TO_CLAIM') {
            return {
                success: false,
                message: 'Order is not ready to claim.',
                error: 'INVALID_STATUS',
            };
        }
        const updated = {
            ...order,
            claimInitiatedAt: Date.now(),
        };
        return {
            success: true,
            message: `Claim initiated! Staff terminal unlocked for ${cutoffMins} minutes.`,
            data: updated,
        };
    },
    /**
     * POST /api/staff/orders/{id}/claim
     * Staff releases parcel to customer once unlocked.
     */
    staffRelease: (order, cutoffMins = 5) => {
        if (order.status !== 'READY_TO_CLAIM') {
            return {
                success: false,
                message: `Order cannot be released in ${order.status} status.`,
                error: 'INVALID_STATUS',
            };
        }
        if (!isClaimUnlocked(order, cutoffMins)) {
            return {
                success: false,
                message: 'Order interaction locked. Customer must initiate claim from mobile app first.',
                error: 'CLAIM_NOT_UNLOCKED',
            };
        }
        const finalChange = !order.change || order.change === 'To Be Determined' ? '₱20' : order.change;
        const updated = {
            ...order,
            status: 'CLAIMED',
            claimedTime: 'Just now',
            change: finalChange,
            claimInitiatedAt: null,
        };
        return {
            success: true,
            message: `Parcel released to customer. Cash change ${finalChange} handed over.`,
            data: updated,
        };
    },
};
