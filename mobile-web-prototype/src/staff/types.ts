import { Order, StaffFilter } from '../types';

export type { Order, StaffFilter };

export type StaffTabStatus = 'active' | 'ready' | 'unpaid' | 'claimed';

export interface StaffBadgeCounts {
  active: number;
  ready: number;
  unpaid: number;
  claimed: number;
}

