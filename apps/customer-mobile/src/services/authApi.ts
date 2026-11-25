import { v1Fetch } from './apiClient';
import { v1Storage } from '../utils/storage';
import {
  CustomerRegisterReq,
  CustomerRegisterRes,
  CustomerLoginReq,
  CustomerLoginRes,
  CustomerCreateMpinReq,
  CustomerCreateMpinRes,
  CustomerVerifyMpinReq,
  CustomerVerifyMpinRes,
  CustomerRefreshTokenReq,
  CustomerRefreshTokenRes,
  CustomerForgotPasswordReq,
  CustomerForgotPasswordRes,
  CustomerVerifyPasswordResetOtpReq,
  CustomerVerifyPasswordResetOtpRes,
  CustomerResetPasswordReq,
  CustomerResetPasswordRes,
} from '../types/api';

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

  /**
   * POST /api/v1/customer/login
   * Authenticates customer credentials and receives preAuthToken
   */
  async login(payload: CustomerLoginReq): Promise<CustomerLoginRes> {
    const res = await v1Fetch<CustomerLoginRes>('/api/v1/customer/login', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
      }),
    });

    if (res?.preAuthToken) {
      await v1Storage.setPreAuthToken(res.preAuthToken);
    }

    return res;
  },

  /**
   * POST /api/v1/customer/create-mpin
   * Sets up initial 4-digit MPIN, returns authToken, refreshToken, and profile
   */
  async createMpin(payload: CustomerCreateMpinReq): Promise<CustomerCreateMpinRes> {
    const res = await v1Fetch<CustomerCreateMpinRes>('/api/v1/customer/create-mpin', {
      method: 'POST',
      body: JSON.stringify({
        preAuthToken: payload.preAuthToken,
        mpin: payload.mpin,
      }),
    });

    if (res?.authToken) {
      await v1Storage.setAuthToken(res.authToken);
    }
    if (res?.refreshToken) {
      await v1Storage.setRefreshToken(res.refreshToken);
    }
    if (res?.customer) {
      await v1Storage.setCustomerProfile(res.customer);
    }
    await v1Storage.clearPreAuthToken();

    return res;
  },

  /**
   * POST /api/v1/customer/mpin
   * Verifies 4-digit MPIN against preAuthToken, returns authToken, refreshToken, and profile
   */
  async verifyMpin(payload: CustomerVerifyMpinReq): Promise<CustomerVerifyMpinRes> {
    const res = await v1Fetch<CustomerVerifyMpinRes>('/api/v1/customer/mpin', {
      method: 'POST',
      body: JSON.stringify({
        preAuthToken: payload.preAuthToken,
        mpin: payload.mpin,
      }),
    });

    if (res?.authToken) {
      await v1Storage.setAuthToken(res.authToken);
    }
    if (res?.refreshToken) {
      await v1Storage.setRefreshToken(res.refreshToken);
    }
    if (res?.customer) {
      await v1Storage.setCustomerProfile(res.customer);
    }
    await v1Storage.clearPreAuthToken();

    return res;
  },

  /**
   * POST /api/v1/customer/refresh
   * Exchanges refreshToken + 4-digit MPIN for renewed authToken (Silent Session Unlock)
   */
  async refreshToken(payload: CustomerRefreshTokenReq): Promise<CustomerRefreshTokenRes> {
    const res = await v1Fetch<CustomerRefreshTokenRes>('/api/v1/customer/refresh', {
      method: 'POST',
      body: JSON.stringify({
        refreshToken: payload.refreshToken,
        mpin: payload.mpin,
      }),
    });

    if (res?.authToken) {
      await v1Storage.setAuthToken(res.authToken);
    }

    return res;
  },

  /**
   * POST /api/v1/customer/forgot-password
   * Requests a 6-digit password reset OTP for the given email
   */
  async forgotPassword(payload: CustomerForgotPasswordReq): Promise<CustomerForgotPasswordRes> {
    return v1Fetch<CustomerForgotPasswordRes>('/api/v1/customer/forgot-password', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email.trim().toLowerCase(),
      }),
    });
  },

  /**
   * POST /api/v1/customer/forgot-password/verify
   * Verifies the 6-digit password reset OTP and returns a short-lived resetToken
   */
  async verifyPasswordResetOtp(
    payload: CustomerVerifyPasswordResetOtpReq
  ): Promise<CustomerVerifyPasswordResetOtpRes> {
    return v1Fetch<CustomerVerifyPasswordResetOtpRes>('/api/v1/customer/forgot-password/verify', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email.trim().toLowerCase(),
        code: payload.code.trim(),
      }),
    });
  },

  /**
   * POST /api/v1/customer/forgot-password/reset
   * Resets the customer password using the verified resetToken
   */
  async resetPassword(payload: CustomerResetPasswordReq): Promise<CustomerResetPasswordRes> {
    return v1Fetch<CustomerResetPasswordRes>('/api/v1/customer/forgot-password/reset', {
      method: 'POST',
      body: JSON.stringify({
        resetToken: payload.resetToken,
        newPassword: payload.newPassword,
      }),
    });
  },
};
