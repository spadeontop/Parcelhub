import type { RealtimeTokenRes } from '@parcelhub/contracts';
import { staffFetch } from './apiClient';

/**
 * POST /api/v1/realtime/token
 * Mints a short-lived Supabase Realtime JWT scoped to the staff channel (`staff:orders`).
 */
export async function fetchStaffRealtimeToken(
  token?: string,
  signal?: AbortSignal
): Promise<RealtimeTokenRes> {
  return staffFetch<RealtimeTokenRes>('/api/v1/realtime/token', {
    method: 'POST',
    token,
    signal,
    fallbackErrorMessage: 'Failed to mint realtime token',
  });
}

export const realtimeApi = {
  fetchStaffRealtimeToken,
};
