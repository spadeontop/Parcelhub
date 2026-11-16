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

export interface StatusTheme {
  label: string;
  dotColor: string;
  textColor: string;
}

export function getStatusTheme(status: OrderStatus): StatusTheme {
  switch (status) {
    case 'PENDING_INITIALIZATION':
      return {
        label: 'Pending Initialization',
        dotColor: '#64748b',
        textColor: '#64748b',
      };
    case 'PAYMENT_REQUIRED':
      return {
        label: 'Payment Required',
        dotColor: '#d97706',
        textColor: '#d97706',
      };
    case 'AWAITING_PARCEL':
      return {
        label: 'Awaiting Parcel',
        dotColor: '#2563eb',
        textColor: '#2563eb',
      };
    case 'READY_TO_CLAIM':
      return {
        label: 'Ready to Claim',
        dotColor: '#059669',
        textColor: '#059669',
      };
    case 'CLAIMED':
      return {
        label: 'Claimed',
        dotColor: '#64748b',
        textColor: '#64748b',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        dotColor: '#dc2626',
        textColor: '#dc2626',
      };
    default:
      return {
        label: status,
        dotColor: '#64748b',
        textColor: '#64748b',
      };
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

export function getStatusPillStyles(status: OrderStatus): {
  containerStyle: { backgroundColor: string; borderColor?: string; borderWidth?: number };
  textColor: string;
} {
  switch (status) {
    case 'PENDING_INITIALIZATION':
      return {
        containerStyle: { backgroundColor: '#f3f4f6' },
        textColor: '#6b7280',
      };
    case 'PAYMENT_REQUIRED':
      return {
        containerStyle: {
          backgroundColor: '#fffbeb',
          borderColor: '#fef3c7',
          borderWidth: 1,
        },
        textColor: '#b45309',
      };
    case 'AWAITING_PARCEL':
      return {
        containerStyle: { backgroundColor: '#eff6ff' },
        textColor: '#2563eb',
      };
    case 'READY_TO_CLAIM':
      return {
        containerStyle: {
          backgroundColor: '#ecfdf5',
          borderColor: '#d1fae5',
          borderWidth: 1,
        },
        textColor: '#047857',
      };
    case 'CLAIMED':
      return {
        containerStyle: { backgroundColor: '#f1f5f9' },
        textColor: '#64748b',
      };
    case 'CANCELLED':
      return {
        containerStyle: {
          backgroundColor: '#fef2f2',
          borderColor: '#fee2e2',
          borderWidth: 1,
        },
        textColor: '#b91c1c',
      };
    default:
      return {
        containerStyle: { backgroundColor: '#f3f4f6' },
        textColor: '#6b7280',
      };
  }
}
