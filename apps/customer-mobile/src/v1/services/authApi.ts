import { v1Fetch } from './apiClient';
import { v1Storage } from '../utils/storage';
import { CustomerRegisterReq, CustomerRegisterRes } from '../types/api';

export const authApi = {
  /**
   * POST /api/v1/customer/register
   * Registers a new customer account and stores preAuthToken
   */
  async register(payload: CustomerRegisterReq): Promise<CustomerRegisterRes> {
    const res = await v1Fetch<CustomerRegisterRes>('/api/v1/customer/register', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        firstName: payload.firstName,
        lastName: payload.lastName,
        middleInitial: payload.middleInitial || undefined,
        phoneNumber: payload.phoneNumber,
      }),
    });

    if (res?.preAuthToken) {
      await v1Storage.setPreAuthToken(res.preAuthToken);
    }

    return res;
  },
};
