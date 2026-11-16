import { v1Fetch } from './apiClient';
import { v1Storage } from '../utils/storage';
import { CustomerProfileRes } from '../types/api';

export const customerApi = {
  /**
   * GET /api/v1/customer/profile
   * Retrieves sanitized profile of currently authenticated customer
   */
  async getProfile(authToken: string): Promise<CustomerProfileRes> {
    const res = await v1Fetch<CustomerProfileRes>('/api/v1/customer/profile', {
      method: 'GET',
      token: authToken,
    });

    if (res?.customer) {
      await v1Storage.setCustomerProfile(res.customer);
    }

    return res;
  },
};
