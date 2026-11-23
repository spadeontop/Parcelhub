import {
  NotificationUploadTokenRes,
  NotificationDeleteTokenRes,
} from '../types/api';
import { v1Fetch } from './apiClient';

export const notificationApi = {
  /**
   * Upload device FCM push token to backend v1
   */
  async uploadToken(fcmToken: string, token: string): Promise<NotificationUploadTokenRes> {
    return v1Fetch<NotificationUploadTokenRes>('/api/v1/notification/upload-token', {
      method: 'POST',
      token,
      body: JSON.stringify({ fcmToken }),
    });
  },

  /**
   * Delete/deregister device FCM push token from backend v1
   */
  async deleteToken(token: string, fcmToken?: string): Promise<NotificationDeleteTokenRes> {
    return v1Fetch<NotificationDeleteTokenRes>('/api/v1/notification/token', {
      method: 'DELETE',
      token,
      body: fcmToken ? JSON.stringify({ fcmToken }) : undefined,
    });
  },
};
