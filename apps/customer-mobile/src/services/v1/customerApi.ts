import { ENV } from '../../config/env';
import { CustomerLoginReq, CustomerLoginRes, ApiError } from './types';

export const customerApiV1 = {
  /**
   * POST /api/v1/customer/login
   * Authenticates customer credentials and returns a preAuthToken (5m TTL).
   * Conforms to backend/app/types/v1/api.ts contract.
   */
  async login(
    payload: CustomerLoginReq,
    baseUrl: string = ENV.API_BASE_URL
  ): Promise<CustomerLoginRes> {
    const res = await fetch(`${baseUrl}/api/v1/customer/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: payload.email.trim(),
        password: payload.password,
      }),
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data?.preAuthToken) {
      return {
        statusMessage: data.statusMessage || 'Credentials verified',
        preAuthToken: data.preAuthToken,
      };
    }

    const statusCode = data?.statusCode || res.status;
    const errorType = data?.error || (statusCode === 401 ? 'Unauthorized' : statusCode === 404 ? 'Not Found' : statusCode === 403 ? 'Forbidden' : 'Bad Request');
    const message = data?.message || data?.error || data?.statusMessage || `Login failed (HTTP ${res.status})`;

    throw new ApiError(message, statusCode, errorType);
  },
};
