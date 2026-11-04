export function getStatusLabel(status) {
    switch (status) {
        case 'READY_TO_CLAIM':
            return 'Ready to Claim';
        case 'AWAITING_PARCEL':
            return 'Awaiting Parcel';
        case 'PAYMENT_REQUIRED':
            return 'Payment Required';
        case 'CLAIMED':
            return 'Claimed';
        default:
            return status;
    }
}
export function getStatusTextColor(status) {
    switch (status) {
        case 'READY_TO_CLAIM':
            return '#10b780';
        case 'AWAITING_PARCEL':
            return '#215cd4';
        case 'PAYMENT_REQUIRED':
            return '#c58b12';
        case 'CLAIMED':
            return '#647b92';
        default:
            return '#1e1e1e';
    }
}
export function getStatusBgColor(status) {
    switch (status) {
        case 'READY_TO_CLAIM':
            return 'rgba(16, 183, 128, 0.15)';
        case 'AWAITING_PARCEL':
            return 'rgba(33, 92, 212, 0.15)';
        case 'PAYMENT_REQUIRED':
            return 'rgba(197, 139, 18, 0.15)';
        case 'CLAIMED':
            return 'rgba(100, 123, 146, 0.15)';
        default:
            return 'rgba(100, 123, 146, 0.1)';
    }
}
export function getStatusBorderColor(status) {
    switch (status) {
        case 'READY_TO_CLAIM':
            return 'rgba(16, 183, 128, 0.3)';
        case 'AWAITING_PARCEL':
            return 'rgba(33, 92, 212, 0.3)';
        case 'PAYMENT_REQUIRED':
            return 'rgba(197, 139, 18, 0.3)';
        case 'CLAIMED':
            return 'rgba(100, 123, 146, 0.3)';
        default:
            return 'transparent';
    }
}
export function mapStaffFilterToStatus(filter) {
    switch (filter) {
        case 'active':
            return 'AWAITING_PARCEL';
        case 'ready_to_claim':
            return 'READY_TO_CLAIM';
        case 'inactive':
            return 'PAYMENT_REQUIRED';
        case 'claimed':
            return 'CLAIMED';
        default:
            return null;
    }
}
export function mapStatusToStaffFilter(status) {
    switch (status) {
        case 'AWAITING_PARCEL':
            return 'active';
        case 'READY_TO_CLAIM':
            return 'ready_to_claim';
        case 'PAYMENT_REQUIRED':
            return 'inactive';
        case 'CLAIMED':
            return 'claimed';
    }
}
