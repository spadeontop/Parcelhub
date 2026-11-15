import { ENV } from '../../config/env';
import {
  CustomerLoginReq,
  CustomerLoginRes,
  CustomerRegisterReq,
  CustomerRegisterRes,
  ApiError,
} from './types';

export const customerApiV1 = {
  /**
   * POST /api/v1/customer/login
   * Authenticates customer credentials and returns a preAuthToken (5m TTL).
   * All business errors strictly pass through the backend API response message.
   * Only network / connection dropouts produce an unreachable API error.
   */
  async login(
    payload: CustomerLoginReq,
    baseUrl: string = ENV.API_BASE_URL
  ): Promise<CustomerLoginRes> {
    let res: Response;

    try {
      res = await fetch(`${baseUrl}/api/v1/customer/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: payload.email.trim(),
          password: payload.password,
        }),
      });
    } catch {
      throw new ApiError(
        'Server unreachable. Please check your internet connection.',
        0,
        'NetworkError',
        true
      );
    }

    const data = await res.json().catch(() => null);

    if (res.ok && data?.preAuthToken) {
      return {
        statusMessage: data.statusMessage || 'Credentials verified',
        preAuthToken: data.preAuthToken,
      };
    }

    const statusCode = data?.statusCode || res.status;
    const errorType = data?.error || 'Error';
    const backendMessage = data?.message || data?.error;

    if (backendMessage) {
      throw new ApiError(backendMessage, statusCode, errorType, false);
    }

    // In the rare event the server responded with non-JSON (e.g., HTML 502/503 from a proxy)
    throw new ApiError(
      `Service temporarily unavailable (${res.status})`,
      statusCode,
      'GatewayError',
      true
    );
  },

  /**
   * POST /api/v1/customer/register
   * Registers a new customer account and returns a preAuthToken (5m TTL).
   * All business errors (e.g. 409 Conflict) strictly pass through backend message.
   * Only network / connection dropouts produce an unreachable API error.
   */
  async register(
    payload: CustomerRegisterReq,
    baseUrl: string = ENV.API_BASE_URL
  ): Promise<CustomerRegisterRes> {
    let res: Response;

    try {
      res = await fetch(`${baseUrl}/api/v1/customer/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: payload.email.trim(),
          password: payload.password,
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          middleInitial: payload.middleInitial?.trim() || undefined,
          phoneNumber: payload.phoneNumber.trim(),
        }),
      });
    } catch {
      throw new ApiError(
        'Server unreachable. Please check your internet connection.',
        0,
        'NetworkError',
        true
      );
    }

    const data = await res.json().catch(() => null);

    if (res.ok && data?.preAuthToken) {
      return {
        statusMessage: data.statusMessage || 'Registration successful',
        preAuthToken: data.preAuthToken,
      };
    }

    const statusCode = data?.statusCode || res.status;
    const errorType = data?.error || 'Error';
    const backendMessage = data?.message || data?.error;

    if (backendMessage) {
      throw new ApiError(backendMessage, statusCode, errorType, false);
    }

    throw new ApiError(
      `Service temporarily unavailable (${res.status})`,
      statusCode,
      'GatewayError',
      true
    );
  },
};
