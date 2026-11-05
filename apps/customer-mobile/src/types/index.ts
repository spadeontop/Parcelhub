import {
  Order,
  OrderStatus,
  DraftOrder,
  ToastState,
  TransactionFilter,
  StaffFilter,
  RoleMode,
  ViewMode,
  CustomerRegisterRequest,
  CustomerRegisterResponse,
  CustomerLoginRequest,
  CustomerLoginResponse,
  CustomerCreateMpinRequest,
  CustomerCreateMpinResponse,
  CustomerVerifyMpinRequest,
  CustomerVerifyMpinResponse,
  AuthCustomer,
  NotificationItem,
} from '@parcelhub/contracts';

export type {
  Order,
  OrderStatus,
  DraftOrder,
  ToastState,
  TransactionFilter,
  StaffFilter,
  RoleMode,
  ViewMode,
  CustomerRegisterRequest,
  CustomerRegisterResponse,
  CustomerLoginRequest,
  CustomerLoginResponse,
  CustomerCreateMpinRequest,
  CustomerCreateMpinResponse,
  CustomerVerifyMpinRequest,
  CustomerVerifyMpinResponse,
  AuthCustomer,
  NotificationItem,
};

export type ScreenId =
  | 'home'
  | 'create_order'
  | 'confirm_order'
  | 'payment_verification'
  | 'qr_screen'
  | 'order_details'
  | 'transactions'
  | 'notifications'
  | 'login'
  | 'register'
  | 'mpin_login'
  | 'mpin_create'
  | 'profile';

export type ScenarioId =
  | 'figma-1'
  | 'figma-2'
  | 'figma-3'
  | 'figma-4'
  | 'figma-5'
  | 'figma-6'
  | 'figma-7'
  | 'figma-8'
  | 'figma-9'
  | 'figma-10'
  | 'figma-11'
  | 'figma-12'
  | 'figma-login'
  | 'figma-register'
  | 'figma-mpin-login'
  | 'figma-mpin-create'
  | 'figma-profile';


