import { OrderStatus } from '../types';

export function getStatusLabel(status: OrderStatus): string {
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

export function getStatusTextColor(status: OrderStatus): string {
  switch (status) {
    case 'READY_TO_CLAIM':
      return 'text-[#10b780]';
    case 'AWAITING_PARCEL':
      return 'text-[#215cd4]';
    case 'PAYMENT_REQUIRED':
      return 'text-[#c58b12]';
    case 'CLAIMED':
      return 'text-gray-500';
    default:
      return 'text-gray-900';
  }
}

export function getStatusDotClass(status: OrderStatus): string {
  switch (status) {
    case 'READY_TO_CLAIM':
      return 'bg-[#10b780] pulse-green';
    case 'AWAITING_PARCEL':
      return 'bg-[#215cd4] pulse-blue';
    case 'PAYMENT_REQUIRED':
      return 'bg-[#c58b12] pulse-gold';
    case 'CLAIMED':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
}

export function getStatusHeroBadgeClass(status: OrderStatus): string {
  switch (status) {
    case 'READY_TO_CLAIM':
      return 'bg-[#10b780]/20 text-[#10b780] border border-[#10b780]/30';
    case 'AWAITING_PARCEL':
      return 'bg-[#215cd4]/20 text-blue-400 border border-[#215cd4]/30';
    case 'PAYMENT_REQUIRED':
      return 'bg-[#c58b12]/20 text-amber-300 border border-[#c58b12]/30';
    case 'CLAIMED':
      return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    default:
      return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
  }
}
