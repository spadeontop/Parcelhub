import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { JWTToken } from '../types/api';
import { notificationApi } from '../services/notificationApi';
import {
  requestNotificationPermission,
  getFcmDeviceToken,
  setupFcmForegroundListener,
  setupFcmNotificationOpenedListener,
  checkInitialNotification,
  setupFcmTokenRefreshListener,
  RemoteFcmMessage,
} from '../services/fcmService';
import { v1Storage } from '../utils/storage';
import { formatOrderDate } from '../utils/date';
import { useAuthSession } from './AuthSessionContext';
import { useNavigationUi } from './NavigationAndUiContext';
import { useToast } from './ToastContext';
import { useCustomerOrders } from '../hooks/useCustomerOrders';

export type CustomerNotification = {
  readonly id: string;
  readonly orderId?: string;
  readonly title: string;
  readonly body: string;
  readonly time: string;
  readonly unread: boolean;
};

export type NotificationsContextType = {
  readonly notifications: readonly CustomerNotification[];
  readonly markAllNotificationsAsRead: () => void;
  readonly notificationsEnabled: boolean;
  readonly togglePushNotifications: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

/**
 * Manages derived in-app order notifications, unread state, and FCM push lifecycle listeners.
 */
export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { authToken } = useAuthSession();
  const { navigateTo } = useNavigationUi();
  const { showToast } = useToast();
  const { orders, refetchOrders } = useCustomerOrders();

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [readNotificationIds, setReadNotificationIds] = useState<ReadonlySet<string>>(
    new Set()
  );

  useEffect(() => {
    v1Storage
      .getPushNotificationsEnabled()
      .then(setNotificationsEnabled)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!authToken) {
      setReadNotificationIds(new Set());
    }
  }, [authToken]);

  const registerDevicePushToken = useCallback(async (tokenToAuth: JWTToken) => {
    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        return;
      }
      const fcmToken = await getFcmDeviceToken();
      if (fcmToken) {
        await notificationApi.uploadToken(fcmToken, tokenToAuth);
      }
    } catch (err) {
      console.warn('[FCM] Push token registration warning:', err);
    }
  }, []);

  useEffect(() => {
    if (authToken && notificationsEnabled) {
      registerDevicePushToken(authToken);
    }
  }, [authToken, notificationsEnabled, registerDevicePushToken]);

  useEffect(() => {
    if (!authToken) return;

    const handleNotificationRoute = (message: RemoteFcmMessage) => {
      const orderId = message.data?.orderId || message.data?.notifId;
      const status = message.data?.status;
      if (orderId) {
        if (status === 'READY_TO_CLAIM') {
          navigateTo('qr_screen', { orderId });
        } else {
          navigateTo('order_details', { orderId });
        }
      } else {
        navigateTo('notifications');
      }
    };

    const unsubForeground = setupFcmForegroundListener((message: RemoteFcmMessage) => {
      const title = message.notification?.title || 'Order Update';
      const body = message.notification?.body || 'Your order status has been updated';
      showToast(`📦 ${title}: ${body}`);
      refetchOrders().catch(() => {});
    });

    const unsubOpened = setupFcmNotificationOpenedListener(handleNotificationRoute);
    checkInitialNotification(handleNotificationRoute);

    const unsubRefresh = setupFcmTokenRefreshListener(async (newToken: string) => {
      if (authToken && notificationsEnabled) {
        try {
          await notificationApi.uploadToken(newToken, authToken);
        } catch (e) {
          console.warn('[FCM] Error updating refreshed token:', e);
        }
      }
    });

    return () => {
      unsubForeground();
      unsubOpened();
      unsubRefresh();
    };
  }, [authToken, notificationsEnabled, showToast, refetchOrders, navigateTo]);

  const togglePushNotifications = useCallback(async () => {
    const nextVal = !notificationsEnabled;
    setNotificationsEnabled(nextVal);
    await v1Storage.setPushNotificationsEnabled(nextVal);

    if (nextVal) {
      if (authToken) {
        const hasPerm = await requestNotificationPermission();
        if (hasPerm) {
          const token = await getFcmDeviceToken();
          if (token) {
            await notificationApi.uploadToken(token, authToken);
          }
          showToast('Push notifications enabled');
        } else {
          showToast('Notification permission not granted in system settings');
        }
      }
    } else {
      if (authToken) {
        try {
          await notificationApi.deleteToken(authToken);
        } catch {}
      }
      showToast('Push notifications disabled');
    }
  }, [notificationsEnabled, authToken, showToast]);

  const notifications = useMemo<readonly CustomerNotification[]>(() => {
    return orders.map((o) => {
      let title = 'Order Update';
      let body = `${o.productName || 'Your order'} status is now ${o.status}.`;
      if (o.status === 'READY_TO_CLAIM') {
        title = 'Parcel Ready for Claim';
        body = `${o.productName || 'Your parcel'} has arrived at Lily’s Catering Hub and is ready for pickup.`;
      } else if (o.status === 'AWAITING_PARCEL') {
        title = 'Payment Verified';
        body = `Payment received for ${o.productName || 'your parcel'}. Now awaiting courier arrival.`;
      } else if (o.status === 'PAYMENT_REQUIRED') {
        title = 'Order Created';
        body = `Order initialized for ${o.productName || 'item'}. Please complete payment at Lily’s Catering Hub.`;
      } else if (o.status === 'CLAIMED') {
        title = 'Parcel Claimed';
        body = `${o.productName || 'Parcel'} was claimed. Thank you for using ParcelHub!`;
      }

      const notifId = `${o.id}_${o.status}`;
      return {
        id: notifId,
        orderId: o.id,
        title,
        body,
        time: formatOrderDate(o.timestamp),
        unread: !readNotificationIds.has(notifId),
      };
    });
  }, [orders, readNotificationIds]);

  const markAllNotificationsAsRead = useCallback(() => {
    const allIds = new Set<string>();
    notifications.forEach((n) => allIds.add(n.id));
    setReadNotificationIds(allIds);
  }, [notifications]);

  const value = useMemo<NotificationsContextType>(
    () => ({
      notifications,
      markAllNotificationsAsRead,
      notificationsEnabled,
      togglePushNotifications,
    }),
    [notifications, markAllNotificationsAsRead, notificationsEnabled, togglePushNotifications]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
