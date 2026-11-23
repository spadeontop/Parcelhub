import { v1Fetch } from './apiClient';
import type { RealtimeTokenRes } from '../types/api';

export const realtimeApi = {
  /**
   * POST /api/v1/realtime/token
   * Mints a short-lived Supabase Realtime JWT scoped to the authenticated customer's private channel.
   */
  async mintToken(authToken: string): Promise<RealtimeTokenRes> {
    return await v1Fetch<RealtimeTokenRes>('/api/v1/realtime/token', {
      method: 'POST',
      token: authToken,
    });
  },
};
