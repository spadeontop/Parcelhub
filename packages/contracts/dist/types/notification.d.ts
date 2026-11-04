export interface NotificationItem {
    id: number;
    title: string;
    body: string;
    time: string;
    unread: boolean;
}
export interface FCMTokenPayload {
    authToken: string;
    fcmToken: string;
}
export interface UploadTokenRequest {
    authToken: string;
    fcmToken: string;
}
export interface SendNotificationRequest {
    notificationBody: string;
    fcmToken: string;
}
//# sourceMappingURL=notification.d.ts.map