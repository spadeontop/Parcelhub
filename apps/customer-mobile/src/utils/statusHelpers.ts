import { OrderStatus } from '../types';

export function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'PENDING_INITIALIZATION':
      return 'Pending Initialization';
    case 'READY_TO_CLAIM':
      return 'Ready to Claim';
    case 'AWAITING_PARCEL':
      return 'Awaiting Parcel';
    case 'PAYMENT_REQUIRED':
      return 'Payment Required';
    case 'CLAIMED':
      return 'Claimed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

export function getStatusTextColor(status: OrderStatus): string {
  switch (status) {
    case 'PENDING_INITIALIZATION':
      return 'text-[#6b7280]';
    case 'READY_TO_CLAIM':
      return 'text-[#10b780]';
    case 'AWAITING_PARCEL':
      return 'text-[#215cd4]';
    case 'PAYMENT_REQUIRED':
      return 'text-[#c58b12]';
    case 'CLAIMED':
      return 'text-gray-500';
    case 'CANCELLED':
      return 'text-rose-500';
    default:
      return 'text-gray-900';
  }
}

export function getStatusColorHex(status: OrderStatus): string {
  switch (status) {
    case 'PENDING_INITIALIZATION':
      return '#6b7280';
    case 'READY_TO_CLAIM':
      return '#10b780';
    case 'AWAITING_PARCEL':
      return '#215cd4';
    case 'PAYMENT_REQUIRED':
      return '#c58b12';
    case 'CLAIMED':
      return '#6b7280';
    case 'CANCELLED':
      return '#ef4444';
    default:
      return '#111827';
  }
}

export function getStatusDotClass(status: OrderStatus): string {
  switch (status) {
    case 'PENDING_INITIALIZATION':
      return 'bg-gray-400';
    case 'READY_TO_CLAIM':
      return 'bg-[#10b780]';
    case 'AWAITING_PARCEL':
      return 'bg-[#215cd4]';
    case 'PAYMENT_REQUIRED':
      return 'bg-[#c58b12]';
    case 'CLAIMED':
      return 'bg-gray-400';
    case 'CANCELLED':
      return 'bg-rose-500';
    default:
      return 'bg-gray-400';
  }
}

export function getStatusBgClass(status: OrderStatus): string {
  switch (status) {
    case 'PENDING_INITIALIZATION':
      return 'bg-gray-50 border border-gray-200';
    case 'READY_TO_CLAIM':
      return 'bg-[#e8fbf3] border border-[#a7f3d0]';
    case 'AWAITING_PARCEL':
      return 'bg-[#eff6ff] border border-[#bfdbfe]';
    case 'PAYMENT_REQUIRED':
      return 'bg-[#fef9c3] border border-[#fde047]';
    case 'CLAIMED':
      return 'bg-gray-100 border border-gray-200';
    case 'CANCELLED':
      return 'bg-rose-50 border border-rose-200';
    default:
      return 'bg-gray-100 border border-gray-200';
  }
}
