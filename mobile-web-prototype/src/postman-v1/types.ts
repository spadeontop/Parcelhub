/**
 * ParcelHub v1 API Postman Types
 * Directly anchored to @parcelhub/contracts (re-exported by backend/app/types/v1/api.ts).
 */

import type {
  ApiErrorResponse,
  ApiRoutes,
  CancelReasonCode,
  CustomerCancelOrderReq,
  CustomerCancelOrderRes,
  CustomerCancelReasonCode,
  CustomerClaimOrderReq,
  CustomerClaimOrderRes,
  CustomerCreateMpinReq,
  CustomerCreateMpinRes,
  CustomerForgotMpinReq,
  CustomerForgotMpinRes,
  CustomerForgotPasswordReq,
  CustomerForgotPasswordRes,
  CustomerGetOrderPhotoQueryParams,
  CustomerGetOrderPhotoRes,
  CustomerGetOrderRes,
  CustomerInitOrderReq,
  CustomerInitOrderRes,
  CustomerInitiateRefundReq,
  CustomerInitiateRefundRes,
  CustomerListOrdersQueryParams,
  CustomerListOrdersRes,
  CustomerLoginReq,
  CustomerLoginRes,
  CustomerOrderDetail,
  CustomerOrderSummary,
  CustomerProfile,
  CustomerProfileRes,
  CustomerRefreshTokenReq,
  CustomerRefreshTokenRes,
  CustomerRegisterReq,
  CustomerRegisterRes,
  CustomerResetMpinReq,
  CustomerResetMpinRes,
  CustomerResetPasswordReq,
  CustomerResetPasswordRes,
  CustomerSendEmailVerificationReq,
  CustomerSendEmailVerificationRes,
  CustomerUpdateOrderReq,
  CustomerUpdateOrderRes,
  CustomerVerifyEmailReq,
  CustomerVerifyEmailRes,
  CustomerVerifyMpinReq,
  CustomerVerifyMpinRes,
  CustomerVerifyMpinResetOtpReq,
  CustomerVerifyMpinResetOtpRes,
  CustomerVerifyPasswordResetOtpReq,
  CustomerVerifyPasswordResetOtpRes,
  HttpMethod,
  NotificationDeleteTokenReq,
  NotificationDeleteTokenRes,
  NotificationUploadTokenReq,
  NotificationUploadTokenRes,
  OrderPhotoType,
  OrderStatus,
  PaginationMeta,
  RealtimeOrderEventType,
  RealtimeOrderSignal,
  RealtimeTokenRes,
  StaffActivateOrderReq,
  StaffActivateOrderRes,
  StaffAttachPhotoReq,
  StaffAttachPhotoRes,
  StaffClaimOrderReq,
  StaffClaimOrderRes,
  StaffGetOrderPhotoQueryParams,
  StaffGetOrderPhotoRes,
  StaffGetOrderRes,
  StaffListOrdersQueryParams,
  StaffListOrdersRes,
  StaffLoginReq,
  StaffLoginRes,
  StaffOrderDetail,
  StaffOrderSummary,
  StaffPayCourierReq,
  StaffPayCourierRes,
  StaffRefundOrderReq,
  StaffRefundOrderRes,
} from '@parcelhub/contracts';

export type {
  ApiErrorResponse,
  ApiRoutes,
  CancelReasonCode,
  CustomerCancelOrderReq,
  CustomerCancelOrderRes,
  CustomerCancelReasonCode,
  CustomerClaimOrderReq,
  CustomerClaimOrderRes,
  CustomerCreateMpinReq,
  CustomerCreateMpinRes,
  CustomerForgotMpinReq,
  CustomerForgotMpinRes,
  CustomerForgotPasswordReq,
  CustomerForgotPasswordRes,
  CustomerGetOrderPhotoQueryParams,
  CustomerGetOrderPhotoRes,
  CustomerGetOrderRes,
  CustomerInitOrderReq,
  CustomerInitOrderRes,
  CustomerInitiateRefundReq,
  CustomerInitiateRefundRes,
  CustomerListOrdersQueryParams,
  CustomerListOrdersRes,
  CustomerLoginReq,
  CustomerLoginRes,
  CustomerOrderDetail,
  CustomerOrderSummary,
  CustomerProfile,
  CustomerProfileRes,
  CustomerRefreshTokenReq,
  CustomerRefreshTokenRes,
  CustomerRegisterReq,
  CustomerRegisterRes,
  CustomerResetMpinReq,
  CustomerResetMpinRes,
  CustomerResetPasswordReq,
  CustomerResetPasswordRes,
  CustomerSendEmailVerificationReq,
  CustomerSendEmailVerificationRes,
  CustomerUpdateOrderReq,
  CustomerUpdateOrderRes,
  CustomerVerifyEmailReq,
  CustomerVerifyEmailRes,
  CustomerVerifyMpinReq,
  CustomerVerifyMpinRes,
  CustomerVerifyMpinResetOtpReq,
  CustomerVerifyMpinResetOtpRes,
  CustomerVerifyPasswordResetOtpReq,
  CustomerVerifyPasswordResetOtpRes,
  HttpMethod,
  NotificationDeleteTokenReq,
  NotificationDeleteTokenRes,
  NotificationUploadTokenReq,
  NotificationUploadTokenRes,
  OrderPhotoType,
  OrderStatus,
  PaginationMeta,
  RealtimeOrderEventType,
  RealtimeOrderSignal,
  RealtimeTokenRes,
  StaffActivateOrderReq,
  StaffActivateOrderRes,
  StaffAttachPhotoReq,
  StaffAttachPhotoRes,
  StaffClaimOrderReq,
  StaffClaimOrderRes,
  StaffGetOrderPhotoQueryParams,
  StaffGetOrderPhotoRes,
  StaffGetOrderRes,
  StaffListOrdersQueryParams,
  StaffListOrdersRes,
  StaffLoginReq,
  StaffLoginRes,
  StaffOrderDetail,
  StaffOrderSummary,
  StaffPayCourierReq,
  StaffPayCourierRes,
  StaffRefundOrderReq,
  StaffRefundOrderRes,
};

export type EndpointDomain = 'customer' | 'staff' | 'shared';

export type EndpointGroup =
  | 'Customer Auth'
  | 'Customer Recovery'
  | 'Customer Account'
  | 'Customer Orders'
  | 'Staff Auth'
  | 'Staff Orders'
  | 'Notifications'
  | 'Realtime';

export type AuthActor = 'none' | 'customer' | 'staff';

export type PostmanEndpointId =
  // Customer Auth & Verification
  | 'customer_register'
  | 'customer_login'
  | 'customer_send_email_verification'
  | 'customer_verify_email'
  | 'customer_create_mpin'
  | 'customer_verify_mpin'
  | 'customer_refresh'
  // Customer Recovery
  | 'customer_forgot_password'
  | 'customer_forgot_password_verify'
  | 'customer_forgot_password_reset'
  | 'customer_forgot_mpin'
  | 'customer_forgot_mpin_verify'
  | 'customer_forgot_mpin_reset'
  // Customer Account & Orders
  | 'customer_profile'
  | 'customer_list_orders'
  | 'customer_get_order'
  | 'customer_get_order_photo'
  | 'customer_initialize_order'
  | 'customer_update_order'
  | 'customer_cancel_order'
  | 'customer_claim_order'
  | 'customer_refund_order'
  // Staff Auth & Orders
  | 'staff_login'
  | 'staff_list_orders'
  | 'staff_get_order'
  | 'staff_get_order_photo'
  | 'staff_activate_order'
  | 'staff_pay_courier'
  | 'staff_attach_photo'
  | 'staff_claim_order'
  | 'staff_refund_order'
  // Shared (Notifications & Realtime)
  | 'notification_upload_token'
  | 'notification_delete_token'
  | 'realtime_token';

export type PostmanFormKey =
  | 'email'
  | 'password'
  | 'newPassword'
  | 'firstName'
  | 'lastName'
  | 'middleInitial'
  | 'phoneNumber'
  | 'otpCode'
  | 'mpin'
  | 'newMpin'
  | 'preAuthToken'
  | 'refreshToken'
  | 'resetToken'
  | 'staffUsername'
  | 'staffPassword'
  | 'orderId'
  | 'customerStatusFilter'
  | 'staffStatusFilter'
  | 'search'
  | 'refundEligible'
  | 'limit'
  | 'offset'
  | 'photoType'
  | 'initImageUrl'
  | 'proofImageUrl'
  | 'trackingId'
  | 'productName'
  | 'recipientName'
  | 'price'
  | 'amountReceived'
  | 'reasonCode'
  | 'reason'
  | 'fcmToken';

export type PostmanFormState = Record<PostmanFormKey, string>;

export type FieldKind = 'text' | 'email' | 'number' | 'select' | 'boolean';

export interface EndpointFieldSpec {
  readonly key: PostmanFormKey;
  readonly label: string;
  readonly section: 'path' | 'query' | 'body';
  readonly kind: FieldKind;
  readonly required?: boolean;
  readonly placeholder?: string;
  readonly options?: readonly string[];
  readonly maxLength?: number;
  readonly mono?: boolean;
  readonly hint?: string;
}

export interface PostmanEndpointSpec {
  readonly id: PostmanEndpointId;
  readonly domain: EndpointDomain;
  readonly group: EndpointGroup;
  readonly title: string;
  readonly shortLabel: string;
  readonly method: HttpMethod;
  readonly pathTemplate: string;
  readonly routeContract: ApiRoutes;
  readonly description: string;
  readonly authPolicy: 'public' | 'customer' | 'staff' | 'any_bearer';
  readonly hasBody: boolean;
  readonly hasOrderIdParam?: boolean;
  readonly fields: readonly EndpointFieldSpec[];
  readonly guardHint?: string;
  readonly contractSummary: {
    readonly reqType: string;
    readonly queryType?: string;
    readonly resType: string;
  };
}

export interface CustomHeaderRow {
  readonly id: string;
  readonly key: string;
  readonly value: string;
  readonly enabled: boolean;
}

export interface CapturedRequest {
  readonly method: HttpMethod;
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly body: unknown | null;
  readonly rawBodyText?: string;
  readonly timestamp: string;
}

export interface CapturedResponse {
  readonly status: number;
  readonly statusText: string;
  readonly ok: boolean;
  readonly durationMs: number;
  readonly sizeBytes: number;
  readonly headers: Record<string, string>;
  readonly body: unknown;
  readonly rawText: string;
  readonly networkError?: string;
}

export interface RequestLogEntry {
  readonly id: string;
  readonly endpointId: PostmanEndpointId;
  readonly endpointTitle: string;
  readonly method: HttpMethod;
  readonly request: CapturedRequest;
  readonly response: CapturedResponse;
}

export interface PostmanTokenVault {
  readonly customerAuthToken: string;
  readonly customerPreAuthToken: string;
  readonly customerRefreshToken: string;
  readonly customerResetToken: string;
  readonly staffAuthToken: string;
  readonly staffRefreshToken: string;
  readonly realtimeToken: string;
  readonly realtimeChannel: string;
}

export interface TargetOrderItem {
  readonly id: string;
  readonly ticketCode: string;
  readonly trackingId: string;
  readonly status: OrderStatus;
  readonly label: string;
  readonly productName?: string;
  readonly recipientName?: string;
  readonly price?: number;
  readonly isClaimActive?: boolean;
  readonly isRefundEligible?: boolean;
  readonly isRefundActive?: boolean;
  readonly courierPaid?: boolean;
}
